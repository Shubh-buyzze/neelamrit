import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function processTruecallerAuth(accessToken: string, requestId: string, profileEndpoint: string) {
  const profileRes = await fetch(profileEndpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}`, "Cache-Control": "no-cache" },
  });

  if (!profileRes.ok) throw new Error(`Truecaller profile fetch failed: ${profileRes.status}`);

  const profile = await profileRes.json();

  const rawPhone = (Array.isArray(profile.phoneNumbers) ? profile.phoneNumbers[0] : null) || profile.phoneNumber || "";
  const phone = String(rawPhone).replace(/^\+91/, "").trim();
  const firstName = profile.firstName || "";
  const lastName = profile.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Truecaller User";
  const avatarUrl = profile.avatarUrl || profile.avatar || null;

  if (!phone) throw new Error("Phone number missing in Truecaller profile");

  // 🟢 REAL EMAIL LOGIC: Truecaller का असली ईमेल निकालें
  const realEmail = profile.email || profile.emailAddress || null;
  const ghostEmail = `${phone}@neelamrit.com`;
  const finalEmail = realEmail || ghostEmail; // अगर असली ईमेल नहीं मिला, तो ghost इस्तेमाल करें

  const tempPassword = "Tc" + Math.random().toString(36).slice(2, 8).toUpperCase() + Math.random().toString(36).slice(2, 6) + "!9";

  let userId = "";

  const { data: existingProfile } = await supabase
    .from("users_profile")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    userId = existingProfile.id;
    await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: finalEmail, // 🟢 यहाँ असली ईमेल इस्तेमाल होगा
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone, avatar_url: avatarUrl },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered") || createErr.code === "email_exists") {
        const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
        const existingAuthUser = listData?.users?.find((u) => u.email === finalEmail);
        if (!existingAuthUser) throw new Error("Auth user not found after email_exists error");
        userId = existingAuthUser.id;
        await supabase.auth.admin.updateUserById(userId, { password: tempPassword });
      } else {
        throw createErr;
      }
    } else {
      userId = created.user.id;
    }
  }

  await supabase.from("users_profile").upsert({
      id: userId,
      phone,
      full_name: fullName,
      avatar_url: avatarUrl,
      role: "customer",
      updated_at: new Date().toISOString(),
    }, { onConflict: "id" }
  );

  // 🟢 Email को tc_auth_requests में सेव करें
  await supabase.from("tc_auth_requests").upsert({
      nonce: requestId,
      phone,
      email: finalEmail, // 👈 यह कॉलम हमने SQL से जोड़ा है
      temp_password: tempPassword,
      status: "success",
      created_at: new Date().toISOString(),
    }, { onConflict: "nonce" }
  );

  return { success: true };
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) body = await req.json();
    else {
      const text = await req.text();
      try { body = JSON.parse(text); } 
      catch { body = Object.fromEntries(new URLSearchParams(text).entries()); }
    }

    const accessToken = body.accessToken || body.token || "";
    const requestId = body.requestId || body.requestNonce || "";
    const profileEndpoint = body.endpoint || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) return NextResponse.json({ success: false, error: "Missing tokens" }, { status: 400 });

    const result = await processTruecallerAuth(accessToken, requestId, profileEndpoint);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
    const requestId = url.searchParams.get("requestId") || url.searchParams.get("requestNonce") || "";
    const profileEndpoint = url.searchParams.get("endpoint") || "https://profile4.truecaller.com/v1/default";

    if (!accessToken || !requestId) return NextResponse.json({ success: false, error: "Missing tokens" }, { status: 400 });

    const result = await processTruecallerAuth(accessToken, requestId, profileEndpoint);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}