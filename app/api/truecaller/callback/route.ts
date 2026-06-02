/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/api/truecaller/callback/route.ts                         ║
 * ║  ADVANCED & BULLETPROOF TRUECALLER WEBHOOK                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function processTruecallerAuth(
  accessToken: string,
  requestId: string,
  profileEndpoint: string
): Promise<NextResponse> {
  try {
    // 1. SAFE ENV VARIABLE CHECK (Prevents Crashing)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("[TC ERROR] Missing Supabase Keys in Environment Variables!");
      return NextResponse.json({ success: false, error: "Server Config Error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    console.log(`[TC] ▶ Starting Auth for Request ID: ${requestId}`);

    // 2. FETCH TRUECALLER PROFILE (Ultra-Fast)
    const profileRes = await fetch(profileEndpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Cache-Control": "no-cache",
      },
    });

    if (!profileRes.ok) {
      console.error(`[TC ERROR] Invalid Token. Status: ${profileRes.status}`);
      return NextResponse.json({ success: false, error: "Truecaller token invalid" }, { status: 401 });
    }

    const profile = await profileRes.json();
    const rawPhone = (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) || profile.phoneNumber || "";
    const phone = String(rawPhone).replace(/^\+91/, "").replace(/\D/g, "").trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json({ success: false, error: "Valid phone not found" }, { status: 400 });
    }

    // 3. PARSE USER DATA
    const firstName = (profile.firstName || "").trim();
    const lastName = (profile.lastName || "").trim();
    const fullName = [firstName, lastName].filter(Boolean).join(" ");
    const avatarUrl = profile.avatarUrl || profile.avatar || null;
    const realEmail = (profile.onlineIdentities?.email || profile.email || "").trim() || null;
    
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = "Tc" + Math.random().toString(36).slice(2, 9).toUpperCase() + "!7";

    let userId = "";
    let isNewUser = false;
    const parallelTasks: any[] = [];

    // 4. CHECK IF USER EXISTS
    const { data: existingProfile } = await supabase
      .from("users_profile")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingProfile?.id) {
      // USER EXISTS -> Update Password for instant login
      userId = existingProfile.id;
      isNewUser = false;
      parallelTasks.push(supabase.auth.admin.updateUserById(userId, { password: tempPassword }));
    } else {
      // NEW USER -> Create Auth Account
      isNewUser = true;
      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email: ghostEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName, avatar_url: avatarUrl },
      });

      if (createErr) {
        // Fallback if ghost email already exists but profile didn't
        if (createErr.message?.toLowerCase().includes("already been registered")) {
          const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
          const recoveredUser = listData?.users?.find((u) => u.email === ghostEmail);
          if (recoveredUser) {
            userId = recoveredUser.id;
            isNewUser = false;
            parallelTasks.push(supabase.auth.admin.updateUserById(userId, { password: tempPassword }));
          } else {
            throw new Error("Ghost email conflict, user unrecoverable");
          }
        } else {
          throw new Error(`Auth creation failed: ${createErr.message}`);
        }
      } else {
        userId = created.user.id;
      }
    }

    // 5. UPDATE DATABASE (Parallel for Speed)
    const now = new Date().toISOString();
    const profilePayload: Record<string, unknown> = {
      id: userId,
      phone,
      avatar_url: avatarUrl,
      role: "customer",
      updated_at: now,
    };

    if (isNewUser) {
      if (fullName) profilePayload.full_name = fullName;
      profilePayload.profile_complete = false;
      profilePayload.created_at = now;
    }
    if (realEmail) profilePayload.email = realEmail;

    parallelTasks.push(supabase.from("users_profile").upsert(profilePayload, { onConflict: "id" }));
    
    // THIS IS CRITICAL: It tells the frontend that login is done!
    parallelTasks.push(
      supabase.from("tc_auth_requests").upsert({
        nonce: requestId,
        phone,
        temp_password: tempPassword,
        status: "success",
        is_new_user: isNewUser,
        created_at: now,
      }, { onConflict: "nonce" })
    );

    await Promise.all(parallelTasks);

    console.log(`[TC] ✅ Login Success | User: ${phone} | New: ${isNewUser}`);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("[TC CRITICAL ERROR]:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// BULLETPROOF REQUEST PARSER
export async function POST(req: Request) {
  try {
    let body: any = {};
    const text = await req.text();
    try {
      body = JSON.parse(text);
    } catch {
      body = Object.fromEntries(new URLSearchParams(text).entries());
    }

    const accessToken = body.accessToken || body.token || "";
    const requestId = body.requestId || body.requestNonce || "";
    const profileEndpoint = body.endpoint || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) {
      return NextResponse.json({ success: false, error: "Missing tokens in payload" }, { status: 400 });
    }

    return await processTruecallerAuth(accessToken, requestId, profileEndpoint);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}