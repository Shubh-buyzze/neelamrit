/**
 * FILE: src/app/api/truecaller/callback/route.ts
 *
 * ── BUG FIXED: "Invalid login credentials" ─────────────────────────────────
 * Old code: used realEmail (from Truecaller) as Supabase Auth email if available.
 * Frontend: ALWAYS calls signInWithPassword with phone@neelamrit.com.
 * Result: email mismatch → "Invalid login credentials".
 *
 * Fix: Auth email = ALWAYS phone@neelamrit.com. No exceptions.
 *      Real email → ONLY in users_profile.email (shown in UI, not for login).
 *
 * ── PATH: /api/truecaller/callback  (status: /api/truecaller/status) ────────
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

  // ── Step 1: Fetch profile from Truecaller ──────────────────────────────────
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

  // ── Step 2: Extract all fields ────────────────────────────────────────────
  const rawPhone =
    (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) ||
    profile.phoneNumber || "";

  const phone     = String(rawPhone).replace(/^\+91/, "").trim();
  const firstName = profile.firstName || "";
  const lastName  = profile.lastName  || "";
  const fullName  = `${firstName} ${lastName}`.trim() || "";
  const avatarUrl = profile.avatarUrl || profile.avatar || null;

  // Real email from Truecaller — saved to profile table, NEVER used for Auth
  const realEmail: string | null =
    profile.onlineIdentities?.email || profile.email || null;

  if (!phone) throw new Error("Phone number missing in Truecaller profile");

  // ── GHOST EMAIL: the ONLY email ever used for Supabase Auth ───────────────
  // Formula: phone@neelamrit.com — deterministic, always same for same phone.
  // Frontend also computes: `${data.phone}@neelamrit.com` → always matches.
  // Real email lives ONLY in users_profile.email, never in auth.users.email.
  const ghostEmail = `${phone}@neelamrit.com`;

  // Fresh temp password every request — written to tc_auth_requests so
  // frontend can call signInWithPassword immediately after polling succeeds
  const tempPassword =
    "Tc" + Math.random().toString(36).slice(2, 8).toUpperCase() +
    Math.random().toString(36).slice(2, 6) + "!9";

  // ── Step 3: Find or create Auth user ──────────────────────────────────────
  let userId    = "";
  let isNewUser = false;

  // users_profile.phone = source of truth for Truecaller identity
  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("id, full_name")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    // ── Returning user ───────────────────────────────────────────────────
    userId    = existingProfile.id;
    isNewUser = false;
    console.log("[TC-Webhook] Returning user:", userId);

    // MUST update password — old temp password in Auth won't match new one
    const { error: updateErr } = await supabase.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateErr) {
      console.error("[TC-Webhook] Password update failed:", updateErr);
      throw updateErr;
    }

  } else {
    // ── New user ─────────────────────────────────────────────────────────
    isNewUser = true;
    console.log("[TC-Webhook] Creating new user:", ghostEmail);

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email:         ghostEmail,   // ghost email always — NEVER real email
      password:      tempPassword,
      email_confirm: true,         // skip email verification
      user_metadata: { full_name: fullName, phone, avatar_url: avatarUrl },
    });

    if (createErr) {
      // ghost email already in Auth but profile row missing (prior crash recovery)
      if (
        createErr.message?.includes("already been registered") ||
        (createErr as any).code === "email_exists"
      ) {
        console.warn("[TC-Webhook] Ghost email exists in Auth, recovering...");
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existing = listData?.users?.find((u) => u.email === ghostEmail);
        if (!existing) throw new Error("Auth user not found after email_exists error");
        userId    = existing.id;
        isNewUser = false;
        await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
      } else {
        throw createErr;
      }
    } else {
      userId = created.user.id;
    }
  }

  console.log("[TC-Webhook] userId:", userId, "isNewUser:", isNewUser);

  // ── Step 4: Upsert users_profile ──────────────────────────────────────────
  const profilePayload: Record<string, any> = {
    id:         userId,
    phone,
    avatar_url: avatarUrl,
    role:       "customer",
    updated_at: new Date().toISOString(),
  };

  // Pre-fill name from Truecaller only for new users (returning users keep their edited name)
  if (isNewUser && fullName) profilePayload.full_name = fullName;

  // Real email → profile table only (for display/orders), never Auth
  if (realEmail) profilePayload.email = realEmail;

  // New users need to confirm name on /complete-profile
  if (isNewUser) profilePayload.profile_complete = false;

  const { error: profileErr } = await supabase
    .from("users_profile")
    .upsert(profilePayload, { onConflict: "id" });

  if (profileErr) {
    console.error("[TC-Webhook] Profile upsert failed:", profileErr);
    throw profileErr;
  }

  // ── Step 5: Write polling record ──────────────────────────────────────────
  const { error: authReqErr } = await supabase
    .from("tc_auth_requests")
    .upsert(
      {
        nonce:         requestId,
        phone,
        temp_password: tempPassword,
        status:        "success",
        is_new_user:   isNewUser,
        created_at:    new Date().toISOString(),
      },
      { onConflict: "nonce" }
    );

  if (authReqErr) {
    console.error("[TC-Webhook] tc_auth_requests upsert failed:", authReqErr);
    throw authReqErr;
  }

  console.log("[TC-Webhook] ✅ Done:", requestId, "| isNewUser:", isNewUser);
  return { success: true };
}

// ── POST ──────────────────────────────────────────────────────────────────────
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

    const accessToken     = body.accessToken  || body.token        || "";
    const requestId       = body.requestId    || body.requestNonce || "";
    const profileEndpoint = body.endpoint     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      console.error("[TC-Webhook] Missing:", { hasToken: !!accessToken, hasId: !!requestId });
      return NextResponse.json({ success: false, error: "Missing accessToken or requestId" }, { status: 400 });
    }

    return NextResponse.json(await processTruecallerAuth(accessToken, requestId, profileEndpoint));
  } catch (err: any) {
    console.error("[TC-Webhook] POST Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── GET: fallback for Truecaller GET redirects ────────────────────────────────
export async function GET(req: Request) {
  try {
    const url             = new URL(req.url);
    const accessToken     = url.searchParams.get("accessToken")  || url.searchParams.get("token")        || "";
    const requestId       = url.searchParams.get("requestId")    || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint")     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing accessToken or requestId" }, { status: 400 });
    }

    return NextResponse.json(await processTruecallerAuth(accessToken, requestId, profileEndpoint));
  } catch (err: any) {
    console.error("[TC-Webhook] GET Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}