/**
 * FILE: src/app/api/auth/truecaller/callback/route.ts
 *
 * Truecaller POSTs JSON here after user approves:
 * { "requestId": "...", "accessToken": "...", "endpoint": "https://profile4.truecaller.com/v1/default" }
 *
 * Flow:
 * 1. Parse JSON body
 * 2. Fetch profile from Truecaller using the dynamic `endpoint` field
 * 3. Find or create Supabase Auth user
 * 4. Upsert users_profile with all available data
 * 5. Write to tc_auth_requests → frontend polls this to know login succeeded
 * 6. Store `is_new_user` flag → frontend redirects new users to /complete-profile
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function processTruecallerAuth(
  accessToken: string,
  requestId: string,
  profileEndpoint: string
) {
  console.log("[TC-Webhook] Processing:", { requestId, profileEndpoint });

  // ── Step 1: Fetch profile from Truecaller ───────────────────────────────────
  // Use the dynamic `endpoint` Truecaller sends (region-aware), never hardcode it
  const profileRes = await fetch(profileEndpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, "Cache-Control": "no-cache" },
  });

  if (!profileRes.ok) {
    const errText = await profileRes.text();
    console.error("[TC-Webhook] Profile fetch failed:", profileRes.status, errText);
    throw new Error(`Truecaller profile fetch failed: ${profileRes.status}`);
  }

  const profile = await profileRes.json();
  console.log("[TC-Webhook] Raw profile:", JSON.stringify(profile));

  // ── Step 2: Extract all fields ──────────────────────────────────────────────
  const rawPhone =
    (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) ||
    profile.phoneNumber || "";

  const phone     = String(rawPhone).replace(/^\+91/, "").trim();
  const firstName = profile.firstName || "";
  const lastName  = profile.lastName  || "";
  const fullName  = `${firstName} ${lastName}`.trim() || "";
  const avatarUrl = profile.avatarUrl || profile.avatar || null;

  // Truecaller rarely sends real email — check both known locations
  const realEmail: string | null =
    profile.onlineIdentities?.email || profile.email || null;

  if (!phone) throw new Error("Phone number missing in Truecaller profile");

  // Ghost email = internal Auth identifier only (NEVER shown in UI)
  const ghostEmail = `${phone}@neelamrit.com`;
  // Use real email in Auth if available, so user can also login with email+pass
  const authEmail  = realEmail ?? ghostEmail;

  // Fresh temp password on every auth (always in sync between Auth + DB)
  const tempPassword =
    "Tc" + Math.random().toString(36).slice(2, 8).toUpperCase() +
    Math.random().toString(36).slice(2, 6) + "!9";

  // ── Step 3: Find or create Auth user ───────────────────────────────────────
  let userId    = "";
  let isNewUser = false;

  // Check users_profile first (phone is the source of truth for Truecaller users)
  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    // ── Returning user ─────────────────────────────────────────────────────
    userId    = existingProfile.id;
    isNewUser = false;
    console.log("[TC-Webhook] Returning user:", userId);

    // Always sync password so signInWithPassword works with fresh temp password
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateErr) throw updateErr;

  } else {
    // ── New user ───────────────────────────────────────────────────────────
    isNewUser = true;
    console.log("[TC-Webhook] New user, creating auth account for:", authEmail);

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: authEmail,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, avatar_url: avatarUrl },
    });

    if (createErr) {
      // Auth user exists but users_profile row doesn't → fallback
      if (
        createErr.message?.includes("already been registered") ||
        (createErr as any).code === "email_exists"
      ) {
        console.warn("[TC-Webhook] Email exists in Auth but no profile row. Finding user...");
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === authEmail);
        if (!existing) throw new Error("Auth user not found after email_exists error");
        userId = existing.id;
        await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
        isNewUser = false; // treat as returning since Auth row existed
      } else {
        throw createErr;
      }
    } else {
      userId = created.user.id;
    }
  }

  console.log("[TC-Webhook] userId:", userId, "isNewUser:", isNewUser);

  // ── Step 4: Upsert users_profile ───────────────────────────────────────────
  // Always use `id` as conflict key (DB trigger may have pre-created the row)
  // profile_complete = false for new users → frontend will redirect to /complete-profile
  const profilePayload: Record<string, any> = {
    id:               userId,
    phone,
    avatar_url:       avatarUrl,
    role:             "customer",
    updated_at:       new Date().toISOString(),
  };

  // Only set full_name from Truecaller if we have one AND profile is new
  // (don't overwrite a name the user already confirmed on /complete-profile)
  if (isNewUser && fullName) profilePayload.full_name = fullName;

  // Only set email if Truecaller actually provided a real one
  if (realEmail) profilePayload.email = realEmail;

  // Mark profile_complete = false only for brand new users
  if (isNewUser) profilePayload.profile_complete = false;

  const { error: profileErr } = await supabase
    .from("users_profile")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileErr) {
    console.error("[TC-Webhook] Profile upsert failed:", profileErr);
    throw profileErr;
  }

  // ── Step 5: Write tc_auth_requests for polling ──────────────────────────────
  const { error: authReqErr } = await supabase
    .from("tc_auth_requests")
    .upsert(
      {
        nonce:         requestId,
        phone,
        temp_password: tempPassword,
        status:        "success",
        is_new_user:   isNewUser,   // ← frontend uses this for redirect decision
        created_at:    new Date().toISOString(),
      },
      { onConflict: "nonce" }
    );

  if (authReqErr) {
    console.error("[TC-Webhook] tc_auth_requests upsert failed:", authReqErr);
    throw authReqErr;
  }

  console.log("[TC-Webhook] ✅ Done. nonce:", requestId, "isNewUser:", isNewUser);
  return { success: true };
}

// ── POST: Truecaller sends JSON body ─────────────────────────────────────────
export async function POST(req: Request) {
  try {
    let body: any = {};
    const ct = req.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try { body = JSON.parse(text); }
      catch { body = Object.fromEntries(new URLSearchParams(text).entries()); }
    }

    console.log("[TC-Webhook] POST body:", JSON.stringify(body));

    const accessToken     = body.accessToken || body.token || "";
    const requestId       = body.requestId   || body.requestNonce || "";
    const profileEndpoint = body.endpoint    || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing accessToken or requestId" }, { status: 400 });
    }

    return NextResponse.json(await processTruecallerAuth(accessToken, requestId, profileEndpoint));
  } catch (err: any) {
    console.error("[TC-Webhook] POST Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── GET: fallback for Truecaller GET redirects ───────────────────────────────
export async function GET(req: Request) {
  try {
    const url             = new URL(req.url);
    const accessToken     = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
    const requestId       = url.searchParams.get("requestId")   || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint")    || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing accessToken or requestId" }, { status: 400 });
    }

    return NextResponse.json(await processTruecallerAuth(accessToken, requestId, profileEndpoint));
  } catch (err: any) {
    console.error("[TC-Webhook] GET Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}