import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    const params = new URLSearchParams(textBody);
    const accessToken = params.get("accessToken") || params.get("token") || "";
    const requestNonce = params.get("requestNonce") || params.get("requestId") || "";

    if (!accessToken || !requestNonce) return NextResponse.json({ success: false });

    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await tcRes.json();

    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    const ghostEmail = `${phone}@neelamrit.com`;
    // 🟢 नया पासवर्ड फॉर्मेट
    const tempPassword = "Tc_" + Math.random().toString(36).slice(-10) + "Z9!";

    // 🟢 THE FIX: एरर मैसेज पर निर्भर रहने के बजाय सीधा यूज़र ढूँढें
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList.users.find(u => u.email === ghostEmail);

    if (existingUser) {
      // 🟢 अगर यूज़र है, तो हर हाल में पासवर्ड अपडेट करो!
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: tempPassword });
    } else {
      // 🟢 अगर नहीं है, तो नया बनाओ
      await supabaseAdmin.auth.admin.createUser({
        email: ghostEmail,
        password: tempPassword,
        email_confirm: true,
      });
    }

    // Database अपडेट्स
    await supabaseAdmin.from("users_profile").upsert({
      phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });

    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone, temp_password: tempPassword, status: "success"
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function GET(req: Request) { return POST(req); }