import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    // Truecaller का डेटा (POST) रीड करें
    const textBody = await req.text();
    let payload;
    try {
      payload = JSON.parse(textBody);
    } catch {
      const params = new URLSearchParams(textBody);
      payload = Object.fromEntries(params);
    }

    const accessToken = payload.accessToken || payload.token;
    const requestNonce = payload.requestNonce || payload.requestId;

    if (!accessToken || !requestNonce) {
      return NextResponse.redirect(new URL('/login?error=Invalid_Payload', req.url), 302);
    }

    // 1. Fetch Profile from Truecaller
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await tcRes.json();

    let phone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    phone = phone.replace("+91", "").trim();
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 2. Ghost Email & Temp Password
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@";

    // 3. Create or Update User in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ghostEmail,
      password: tempPassword,
      email_confirm: true,
    });

    if (authError && authError.message.includes("already exists")) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === ghostEmail);
      if (existingUser) {
         await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: tempPassword });
      }
    }

    // 4. Update Database Tables
    await supabaseAdmin.from("users_profile").upsert({
      phone: phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });

    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone: phone, temp_password: tempPassword, status: "success"
    });

    // 🟢 THE FIX: ब्राउज़र को सक्सेस पेज पर Redirect करें
    const redirectUrl = new URL(`/truecaller-success?nonce=${requestNonce}`, req.url);
    return NextResponse.redirect(redirectUrl, 302);

  } catch (err: any) {
    console.error("Truecaller Webhook Error:", err);
    return NextResponse.redirect(new URL('/login?error=Truecaller_Failed', req.url), 302);
  }
}