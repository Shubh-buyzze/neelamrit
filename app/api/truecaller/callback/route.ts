/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/api/truecaller/callback/route.ts                        ║
 * ║  Truecaller apna callback is URL pe POST karta hai                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// ── Service-role client ───────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Core logic ────────────────────────────────────────────────────────────────
async function processTruecallerAuth(
  accessToken: string,
  requestId: string,
  profileEndpoint: string
): Promise<NextResponse> {
  console.log("[TC] ▶ Start | requestId:", requestId);

  const profileRes = await fetch(profileEndpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Cache-Control": "no-cache",
    },
  });

  if (!profileRes.ok) {
    return NextResponse.json(
      { success: false, error: `Truecaller token invalid (${profileRes.status})` },
      { status: 401 }
    );
  }

  const profile = await profileRes.json();
  const rawPhone = (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) || profile.phoneNumber || "";
  const phone = String(rawPhone).replace(/^\+91/, "").replace(/\D/g, "").trim();

  if (!phone || phone.length < 10) {
    return NextResponse.json({ success: false, error: "Valid phone not found" }, { status: 400 });
  }

  const firstName = (profile.firstName || "").trim();
  const lastName  = (profile.lastName  || "").trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(" ");
  const avatarUrl = profile.avatarUrl || profile.avatar || null;
  const realEmail: string | null = (profile.onlineIdentities?.email || profile.email || "").trim() || null;

  const ghostEmail = `${phone}@neelamrit.com`;
  const tempPassword = "Tc" + Math.random().toString(36).slice(2, 9).toUpperCase() + Math.random().toString(36).slice(2, 6) + "!7";

  let userId    = "";
  let isNewUser = false;
  
  // 🟢 FIX: Changed Promise<any>[] to any[] to satisfy TypeScript strict mode
  const parallelTasks: any[] = [];

  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    userId    = existingProfile.id;
    isNewUser = false;

    const { data: authData } = await supabase.auth.admin.getUserById(userId);
    const currentAuthEmail   = authData?.user?.email ?? "";

    if (currentAuthEmail && currentAuthEmail !== ghostEmail) {
      parallelTasks.push(
        supabase.auth.admin.updateUserById(userId, { email: ghostEmail, password: tempPassword })
      );
    } else {
      parallelTasks.push(
        supabase.auth.admin.updateUserById(userId, { password: tempPassword })
      );
    }
  } else {
    isNewUser = true;

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email:         ghostEmail,
      password:      tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, avatar_url: avatarUrl },
    });

    if (createErr) {
      const isEmailExists = createErr.message?.toLowerCase().includes("already been registered") || (createErr as any).code === "email_exists";
      if (isEmailExists) {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const recoveredUser = listData?.users?.find((u) => u.email === ghostEmail);
        if (!recoveredUser) throw new Error("Ghost email exists but user not found");
        
        userId    = recoveredUser.id;
        isNewUser = false;
        parallelTasks.push(supabase.auth.admin.updateUserById(userId, { password: tempPassword }));
      } else {
        throw new Error(`Auth user creation failed: ${createErr.message}`);
      }
    } else {
      userId = created.user.id;
    }
  }

  const now = new Date().toISOString();
  const profilePayload: Record<string, unknown> = {
    id:         userId,
    phone,
    avatar_url: avatarUrl,
    role:       "customer",
    updated_at: now,
  };

  if (isNewUser) {
    if (fullName) profilePayload.full_name = fullName;
    profilePayload.profile_complete = false;
    profilePayload.created_at       = now;
  }
  if (realEmail) profilePayload.email = realEmail;

  parallelTasks.push(
    supabase.from("users_profile").upsert(profilePayload, { onConflict: "id" })
  );

  parallelTasks.push(
    supabase.from("tc_auth_requests").upsert({
        nonce:         requestId,
        phone,
        temp_password: tempPassword,
        status:        "success",
        is_new_user:   isNewUser,
        created_at:    now,
      }, { onConflict: "nonce" }
    )
  );

  await Promise.all(parallelTasks);

  console.log("[TC] ✅ Done | nonce:", requestId, "| userId:", userId, "| isNew:", isNewUser);
  return NextResponse.json({ success: true });
}

export async function POST(req: Request) {
  try {
    let body: Record<string, string> = {};
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      try { body = JSON.parse(text); } 
      catch { body = Object.fromEntries(new URLSearchParams(text).entries()); }
    }

    const accessToken     = body.accessToken  || body.token        || "";
    const requestId       = body.requestId    || body.requestNonce || "";
    const profileEndpoint = body.endpoint     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing tokens" }, { status: 400 });
    }

    return await processTruecallerAuth(accessToken, requestId, profileEndpoint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url             = new URL(req.url);
    const accessToken     = url.searchParams.get("accessToken")  || url.searchParams.get("token")        || "";
    const requestId       = url.searchParams.get("requestId")    || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint")     || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing tokens" }, { status: 400 });
    }

    return await processTruecallerAuth(accessToken, requestId, profileEndpoint);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}