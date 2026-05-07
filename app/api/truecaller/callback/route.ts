import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Core handler (shared by GET and POST) ───────────────────────────────────
async function handleTruecallerWebhook(accessToken: string, requestNonce: string) {
  if (!accessToken || !requestNonce) {
    return NextResponse.json({ success: false, error: "Missing tokens" }, { status: 400 });
  }

  // ── Validate token with Truecaller ──────────────────────────────────────────
  const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!tcRes.ok) {
    return NextResponse.json(
      { success: false, error: "Truecaller Token Expired or Invalid" },
      { status: 401 }
    );
  }

  const profile = await tcRes.json();

  const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
  const phone = String(rawPhone).replace("+91", "").trim();
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  const ghostEmail = `${phone}@neelamrit.com`;

  // Generate a fresh temp password on EVERY request (fixes Problem 3 — password sync)
  const tempPassword = "Tc_" + Math.random().toString(36).slice(-10) + "Z9!";

  let userId = "";

  // ── STEP 1: Check if a profile already exists (by phone) ───────────────────
  // FIX (Problem 2): We fetch the `id` here so the upsert always has the PK.
  const { data: existingProfile } = await supabaseAdmin
    .from("users_profile")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    userId = existingProfile.id;

    // FIX (Problem 3): Always update the password for existing users so the
    // new tempPassword written to tc_auth_requests matches what Supabase Auth holds.
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: tempPassword,
    });
    if (updateErr) throw updateErr;

  } else {
    // ── STEP 2: No profile → create a new Auth user ──────────────────────────
    const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ghostEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (createError) {
      // Fallback: user may exist in Auth but profile row was never created.
      // List users and find by email.
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const fallbackUser = userList?.users.find((u) => u.email === ghostEmail);

      if (fallbackUser) {
        userId = fallbackUser.id;
        // Still update the password so it stays in sync (Problem 3 fallback)
        await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
      } else {
        throw createError;
      }
    } else {
      userId = newAuthData.user.id;
      // NOTE: A DB trigger may have already inserted a row in users_profile with
      // just this `id`. The upsert below will UPDATE that row (not insert a
      // duplicate), because we supply the same `id` as the primary key.
      // (This is the fix for Problem 2.)
    }
  }

  // ── STEP 3: Upsert profile — always include `id` (fixes Problem 2) ─────────
  const { error: profileError } = await supabaseAdmin.from("users_profile").upsert(
    { id: userId, phone, full_name: fullName, role: "customer" },
    { onConflict: "id" }           // ← conflict on PK, not on phone
  );
  if (profileError) throw profileError;

  // ── STEP 4: Write auth-request record for frontend polling ──────────────────
  const { error: stError } = await supabaseAdmin.from("tc_auth_requests").upsert(
    { nonce: requestNonce, phone, temp_password: tempPassword, status: "success" },
    { onConflict: "nonce" }
  );
  if (stError) throw stError;

  return NextResponse.json({ success: true });
}

// ─── POST handler — reads tokens from the request body ───────────────────────
export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);

    const accessToken  = params.get("accessToken")  || params.get("token")     || "";
    const requestNonce = params.get("requestNonce") || params.get("requestId") || "";

    return await handleTruecallerWebhook(accessToken, requestNonce);
  } catch (err: any) {
    console.error("Webhook POST Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ─── GET handler — FIX (Problem 1): reads tokens from QUERY PARAMS ───────────
// Truecaller sometimes redirects to the webhook via a GET request with tokens
// in the URL (?accessToken=...&requestNonce=...).  The old code called
// `POST(req)` which tried to `await req.text()` on a body-less GET and got
// an empty string, so accessToken/requestNonce were always "".
export async function GET(req: Request) {
  try {
    const url    = new URL(req.url);
    const accessToken  = url.searchParams.get("accessToken")  || url.searchParams.get("token")     || "";
    const requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";

    return await handleTruecallerWebhook(accessToken, requestNonce);
  } catch (err: any) {
    console.error("Webhook GET Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}