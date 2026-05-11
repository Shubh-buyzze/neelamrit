/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/api/truecaller/callback/route.ts                        ║
 * ║  Truecaller apna callback is URL pe POST karta hai                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * IRON RULE — kabhi mat todna:
 *   Supabase Auth email  =  ALWAYS  `${phone}@neelamrit.com`   (ghost email)
 *   Real email           =  ONLY    users_profile.email        (display only)
 *   Frontend login       =  ALWAYS  `${phone}@neelamrit.com`   (same formula)
 *
 * Truecaller callback body (JSON):
 *   { requestId, accessToken, endpoint }
 *
 * Flow:
 *   1. Parse body (JSON or form-encoded, both handled)
 *   2. Fetch profile from Truecaller using dynamic `endpoint`
 *   3. Find existing user by phone OR create new Auth user with ghost email
 *   4. If existing user has wrong email in Auth → fix it to ghost email
 *   5. Upsert users_profile
 *   6. Write tc_auth_requests → frontend polls this
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── Service-role client — server only, never expose to browser ────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Core logic (shared by POST + GET handlers) ────────────────────────────────
async function processTruecallerAuth(
  accessToken: string,
  requestId: string,
  profileEndpoint: string
): Promise<NextResponse> {
  console.log("[TC] ▶ Start | requestId:", requestId);

  // ── 1. Truecaller profile fetch ─────────────────────────────────────────────
  const profileRes = await fetch(profileEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!profileRes.ok) {
    const msg = await profileRes.text().catch(() => "");
    console.error("[TC] Profile fetch failed:", profileRes.status, msg);
    return NextResponse.json(
      { success: false, error: `Truecaller token invalid or expired (${profileRes.status})` },
      { status: 401 }
    );
  }

  const profile = await profileRes.json();
  console.log("[TC] Profile received:", JSON.stringify(profile));

  // ── 2. Extract fields ────────────────────────────────────────────────────────
  const rawPhone =
    (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) ||
    profile.phoneNumber ||
    "";

  // Remove country code (+91) and clean
  const phone = String(rawPhone).replace(/^\+91/, "").replace(/\D/g, "").trim();

  if (!phone || phone.length < 10) {
    console.error("[TC] Invalid phone in profile:", rawPhone);
    return NextResponse.json({ success: false, error: "Valid phone not found in Truecaller profile" }, { status: 400 });
  }

  const firstName = (profile.firstName || "").trim();
  const lastName  = (profile.lastName  || "").trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(" ");
  const avatarUrl = profile.avatarUrl || profile.avatar || null;

  // Real email — ONLY for users_profile display, NEVER for Auth login
  const realEmail: string | null =
    (profile.onlineIdentities?.email || profile.email || "").trim() || null;

  // ── GHOST EMAIL — the ONE and ONLY Supabase Auth identifier ────────────────
  // Deterministic: same phone → same ghost email → always works with frontend
  const ghostEmail = `${phone}@neelamrit.com`;

  // New temp password on every call → synced to tc_auth_requests
  // Frontend reads this from DB and uses it for signInWithPassword
  const tempPassword =
    "Tc" +
    Math.random().toString(36).slice(2, 9).toUpperCase() +
    Math.random().toString(36).slice(2, 6) +
    "!7";

  console.log("[TC] phone:", phone, "| ghost:", ghostEmail, "| realEmail:", realEmail);

  // ── 3. Find or create Supabase Auth user ────────────────────────────────────
  let userId    = "";
  let isNewUser = false;

  // Primary lookup: users_profile.phone (most reliable for Truecaller users)
  const { data: existingProfile, error: profileLookupErr } = await supabase
    .from("users_profile")
    .select("id, full_name, profile_complete")
    .eq("phone", phone)
    .maybeSingle();

  if (profileLookupErr) {
    console.error("[TC] Profile lookup error:", profileLookupErr);
    // Non-fatal: continue as new user
  }

  if (existingProfile?.id) {
    // ── RETURNING USER ────────────────────────────────────────────────────────
    userId    = existingProfile.id;
    isNewUser = false;
    console.log("[TC] Returning user found:", userId);

    // SAFETY: Check if Auth has wrong email (real email instead of ghost)
    // This fixes legacy accounts that were created with real email
    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const currentAuthEmail   = authData?.user?.email ?? "";

    if (currentAuthEmail && currentAuthEmail !== ghostEmail) {
      // Fix: update Auth email to ghost email + sync password
      console.warn("[TC] Auth email mismatch! Fixing...", {
        was: currentAuthEmail,
        fixing_to: ghostEmail,
      });
      const { error: fixErr } = await supabase.auth.admin.updateUserById(userId, {
        email:    ghostEmail,
        password: tempPassword,
      });
      if (fixErr) {
        console.error("[TC] Failed to fix auth email:", fixErr);
        throw new Error(`Auth email fix failed: ${fixErr.message}`);
      }
    } else {
      // Email already correct — just update password
      const { error: pwErr } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });
      if (pwErr) {
        console.error("[TC] Password update failed:", pwErr);
        throw new Error(`Password sync failed: ${pwErr.message}`);
      }
    }

  } else {
    // ── NEW USER ──────────────────────────────────────────────────────────────
    isNewUser = true;
    console.log("[TC] Creating new user:", ghostEmail);

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email:         ghostEmail,   // ALWAYS ghost — never real email
      password:      tempPassword,
      email_confirm: true,         // Skip email verification flow
      user_metadata: { full_name: fullName, avatar_url: avatarUrl },
      // NOTE: Do NOT set phone in user_metadata — keep it only in users_profile
    });

    if (createErr) {
      const isEmailExists =
        createErr.message?.toLowerCase().includes("already been registered") ||
        createErr.message?.toLowerCase().includes("already exists") ||
        (createErr as any).code === "email_exists";

      if (isEmailExists) {
        // Ghost email exists in Auth but users_profile row is missing
        // (can happen if previous webhook crashed mid-way)
        console.warn("[TC] Ghost email exists in Auth. Recovering...");

        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const recoveredUser = listData?.users?.find((u) => u.email === ghostEmail);

        if (!recoveredUser) {
          throw new Error("Ghost email exists but user not found in listUsers — contact support");
        }

        userId    = recoveredUser.id;
        isNewUser = false; // treat as returning — profile incomplete

        const { error: recoverPwErr } = await supabase.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });
        if (recoverPwErr) throw new Error(`Recovery password sync failed: ${recoverPwErr.message}`);

        console.log("[TC] Recovered user:", userId);
      } else {
        // Unexpected Auth error
        console.error("[TC] createUser failed:", createErr);
        throw new Error(`Auth user creation failed: ${createErr.message}`);
      }
    } else {
      userId = created.user.id;
      console.log("[TC] New user created:", userId);
    }
  }

  // ── 4. Upsert users_profile ─────────────────────────────────────────────────
  const now = new Date().toISOString();

  const profilePayload: Record<string, unknown> = {
    id:         userId,
    phone,
    avatar_url: avatarUrl,
    role:       "customer",
    updated_at: now,
  };

  if (isNewUser) {
    // Pre-fill Truecaller name for new user (they can edit on /complete-profile)
    if (fullName) profilePayload.full_name = fullName;
    // Mark incomplete so frontend redirects to /complete-profile
    profilePayload.profile_complete = false;
    profilePayload.created_at       = now;
  }
  // NOTE: Don't touch full_name for returning users — they may have edited it

  // Real email → profile only, shown in UI
  if (realEmail) profilePayload.email = realEmail;

  const { error: upsertErr } = await supabase
    .from("users_profile")
    .upsert(profilePayload, { onConflict: "id" });

  if (upsertErr) {
    console.error("[TC] users_profile upsert failed:", upsertErr);
    throw new Error(`Profile save failed: ${upsertErr.message}`);
  }

  // ── 5. Write tc_auth_requests for frontend polling ──────────────────────────
  const { error: reqErr } = await supabase
    .from("tc_auth_requests")
    .upsert(
      {
        nonce:         requestId,
        phone,
        temp_password: tempPassword,   // frontend uses this with signInWithPassword
        status:        "success",
        is_new_user:   isNewUser,      // frontend uses this to redirect
        created_at:    now,
      },
      { onConflict: "nonce" }
    );

  if (reqErr) {
    console.error("[TC] tc_auth_requests upsert failed:", reqErr);
    throw new Error(`Auth request save failed: ${reqErr.message}`);
  }

  console.log("[TC] ✅ Done | nonce:", requestId, "| userId:", userId, "| isNew:", isNewUser);
  return NextResponse.json({ success: true });
}

// ── POST handler — Truecaller sends JSON body ─────────────────────────────────
export async function POST(req: Request) {
  try {
    // Parse body — handle JSON and form-encoded both
    let body: Record<string, string> = {};
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = Object.fromEntries(new URLSearchParams(text).entries());
      }
    }

    console.log("[TC] POST body keys:", Object.keys(body));

    const accessToken     = body.accessToken  || body.token        || "";
    const requestId       = body.requestId    || body.requestNonce || "";
    const profileEndpoint = body.endpoint     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      console.error("[TC] Missing required fields:", { hasToken: !!accessToken, hasId: !!requestId });
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestId" },
        { status: 400 }
      );
    }

    return await processTruecallerAuth(accessToken, requestId, profileEndpoint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TC] POST unhandled error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// ── GET handler — Truecaller GET redirect fallback ────────────────────────────
export async function GET(req: Request) {
  try {
    const url             = new URL(req.url);
    const accessToken     = url.searchParams.get("accessToken")  || url.searchParams.get("token")        || "";
    const requestId       = url.searchParams.get("requestId")    || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint")     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestId" },
        { status: 400 }
      );
    }

    return await processTruecallerAuth(accessToken, requestId, profileEndpoint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[TC] GET unhandled error:", msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}