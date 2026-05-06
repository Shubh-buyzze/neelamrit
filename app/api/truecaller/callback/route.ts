import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin Client (Bypasses RLS to create users)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestNonce, accessToken } = body;

    if (!requestNonce || !accessToken) {
      return NextResponse.json({ success: false, error: "Invalid Payload" }, { status: 400 });
    }

    // 1. Fetch Profile from Truecaller using Access Token
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await tcRes.json();
    
    // Extract Phone (Truecaller returns phone array or string with country code)
    let phone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    phone = phone.replace("+91", "").trim(); // Remove +91 for standard format
    
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 2. Ghost Email Trick for Supabase Login
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@"; // Generate strong temp password

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

    // 4. Update Profile Table
    await supabaseAdmin.from("users_profile").upsert({
      phone: phone,
      full_name: fullName,
      role: "customer"
    }, { onConflict: "phone" });

    // 5. Save Status & Credentials in Polling Table
    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce,
      phone: phone,
      temp_password: tempPassword,
      status: "success"
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Truecaller Webhook Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}