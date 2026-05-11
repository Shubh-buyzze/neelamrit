/**
 * TRUECALLER WEBHOOK CALLBACK
 * Path: /api/auth/truecaller/callback/route.ts
 *
 * Truecaller POSTs JSON to this URL:
 * { "requestId": "...", "accessToken": "...", "endpoint": "https://profile4.truecaller.com/v1/default" }
 *
 * Flow:
 * 1. Parse JSON body (NOT form-urlencoded)
 * 2. Use the `endpoint` field from Truecaller (dynamic, not hardcoded)
 * 3. Fetch user profile from Truecaller
 * 4. Upsert Supabase Auth user (create or update password)
 * 5. Upsert users_profile table
 * 6. Write success record to tc_auth_requests for frontend polling
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ─── Supabase admin client (service role — never expose to frontend) ──────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Shared core logic ────────────────────────────────────────────────────────
async function processTruecallerAuth(
  accessToken: string,
  requestId: string,
  profileEndpoint: string
) {
  console.log("[TC-Webhook] Processing:", { requestId, profileEndpoint });

  // ── Step 1: Validate token + fetch profile from Truecaller ──────────────────
  // CRITICAL: Use the `endpoint` sent by Truecaller, not a hardcoded URL.
  // Truecaller may use region-specific endpoints (profile4-noneu.truecaller.com etc.)
  const profileRes = await fetch(profileEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!profileRes.ok) {
    const errText = await profileRes.text();
    console.error("[TC-Webhook] Profile fetch failed:", profileRes.status, errText);
    throw new Error(`Truecaller profile fetch failed: ${profileRes.status}`);
  }

  const profile = await profileRes.json();
  console.log("[TC-Webhook] Profile received:", JSON.stringify(profile));

  // ── Step 2: Extract fields from profile ─────────────────────────────────────
  // Truecaller returns phoneNumbers as array OR phoneNumber as string
  const rawPhone =
    (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) ||
    profile.phoneNumber ||
    "";

  const phone = String(rawPhone).replace(/^\+91/, "").trim();
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Truecaller User";
  const avatarUrl = profile.avatarUrl || profile.avatar || null;

  if (!phone) throw new Error("Phone number missing in Truecaller profile");

  // Ghost email: phone@yourdomain.com (never shown to user)
  const ghostEmail = `${phone}@neelamrit.com`;

  // Fresh random password every time (synced between Auth + tc_auth_requests)
  const tempPassword =
    "Tc" + Math.random().toString(36).slice(2, 8).toUpperCase() +
    Math.random().toString(36).slice(2, 6) + "!9";

  // ── Step 3: Find or create Supabase Auth user ───────────────────────────────
  let userId = "";

  // First check users_profile by phone (most reliable source of truth)
  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    // ── Existing user: just update their password ──────────────────────────
    userId = existingProfile.id;
    console.log("[TC-Webhook] Existing user found:", userId);

    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateErr) {
      console.error("[TC-Webhook] Password update failed:", updateErr);
      throw updateErr;
    }
  } else {
    // ── New user: create Auth account ──────────────────────────────────────
    console.log("[TC-Webhook] Creating new auth user for:", ghostEmail);

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: ghostEmail,
      password: tempPassword,
      email_confirm: true, // skip email verification
      user_metadata: { full_name: fullName, phone, avatar_url: avatarUrl },
    });

    if (createErr) {
      // Duplicate email: user exists in Auth but not in users_profile
      // (can happen if DB trigger failed previously)
      if (createErr.message?.includes("already been registered") || createErr.code === "email_exists") {
        console.warn("[TC-Webhook] Email exists in Auth but no profile. Fetching user...");

        // Get user by email via admin list (paginated, search first page)
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = listData?.users?.find((u) => u.email === ghostEmail);

        if (!existingAuthUser) throw new Error("Auth user not found after email_exists error");

        userId = existingAuthUser.id;
        // Sync the password
        await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
      } else {
        throw createErr;
      }
    } else {
      userId = created.user.id;
    }
  }

  console.log("[TC-Webhook] Using userId:", userId);

  // ── Step 4: Upsert users_profile (always include `id` as PK) ───────────────
  // onConflict: "id" means if DB trigger already created the row, we UPDATE it.
  // Never use onConflict: "phone" because the row may not have phone yet.
  const { error: profileErr } = await supabase
    .from("users_profile")
    .upsert(
      {
        id: userId,
        phone,
        full_name: fullName,
        avatar_url: avatarUrl,
        role: "customer",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

  if (profileErr) {
    console.error("[TC-Webhook] Profile upsert failed:", profileErr);
    throw profileErr;
  }

  // ── Step 5: Write auth request record for frontend polling ──────────────────
  const { error: authReqErr } = await supabase
    .from("tc_auth_requests")
    .upsert(
      {
        nonce: requestId,
        phone,
        temp_password: tempPassword,
        status: "success",
        created_at: new Date().toISOString(),
      },
      { onConflict: "nonce" }
    );

  if (authReqErr) {
    console.error("[TC-Webhook] tc_auth_requests upsert failed:", authReqErr);
    throw authReqErr;
  }

  console.log("[TC-Webhook] ✅ Success for nonce:", requestId);
  return { success: true };
}

// ─── POST handler: Truecaller sends JSON body ─────────────────────────────────
export async function POST(req: Request) {
  try {
    // Truecaller sends: { "requestId": "...", "accessToken": "...", "endpoint": "..." }
    // Content-Type is application/json
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      // Fallback for form-encoded (some older integrations)
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    } else {
      // Try JSON first, then form-encoded
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        body = Object.fromEntries(params.entries());
      }
    }

    console.log("[TC-Webhook] POST body:", JSON.stringify(body));

    // Truecaller uses "requestId" in the callback (not "requestNonce")
    const accessToken = body.accessToken || body.token || "";
    const requestId = body.requestId || body.requestNonce || "";
    // Use Truecaller's own endpoint (region-aware)
    const profileEndpoint = body.endpoint || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      console.error("[TC-Webhook] Missing fields:", { accessToken: !!accessToken, requestId: !!requestId });
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestId" },
        { status: 400 }
      );
    }

    const result = await processTruecallerAuth(accessToken, requestId, profileEndpoint);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[TC-Webhook] POST Error:", err.message, err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── GET handler: for Truecaller GET redirects ────────────────────────────────
// Some Truecaller implementations also call via GET with query params
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
    const requestId = url.searchParams.get("requestId") || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint") || "https://profile4.truecaller.com/v1/default";

    console.log("[TC-Webhook] GET params:", { accessToken: !!accessToken, requestId });

    if (!accessToken || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestId" },
        { status: 400 }
      );
    }

    const result = await processTruecallerAuth(accessToken, requestId, profileEndpoint);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[TC-Webhook] GET Error:", err.message, err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}