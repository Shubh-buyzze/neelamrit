import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// 🟢 यूनिवर्सल हैंडलर (GET और POST दोनों के लिए)
async function handleRequest(req: Request) {
  try {
    let accessToken = "";
    let requestNonce = "";
    const url = new URL(req.url);

    // 1. डेटा निकालना (GET या POST)
    if (req.method === "GET") {
      accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
      requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";
    } else if (req.method === "POST") {
      const textBody = await req.text();
      try {
        const payload = JSON.parse(textBody);
        accessToken = payload.accessToken || payload.token || "";
        requestNonce = payload.requestNonce || payload.requestId || "";
      } catch {
        const params = new URLSearchParams(textBody);
        accessToken = params.get("accessToken") || params.get("token") || "";
        requestNonce = params.get("requestNonce") || params.get("requestId") || "";
      }
    }

    if (!accessToken || !requestNonce) {
      return NextResponse.json({ success: false, error: "Missing payload" });
    }

    // 2. Truecaller से प्रोफाइल मंगाना
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tcRes.ok) {
      return NextResponse.json({ success: false, error: "Truecaller token invalid/expired" });
    }
    
    const profile = await tcRes.json();

    // 3. सेफ फ़ोन नंबर पार्सिंग
    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = "Tc_" + Math.random().toString(36).slice(-10) + "Z9!";

    // 4. Supabase Auth में पासवर्ड अपडेट या नया यूज़र बनाना
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = userList.users.find(u => u.email === ghostEmail);

    if (existingUser) {
      // अगर यूज़र पहले से है, तो उसका पासवर्ड अपडेट करें
      const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id, 
        { password: tempPassword }
      );
      if (updateErr) throw updateErr;
    } else {
      // अगर नया यूज़र है, तो बनाएँ
      const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: ghostEmail,
        password: tempPassword,
        email_confirm: true,
      });
      if (createErr) throw createErr;
    }

    // 5. Database टेबल्स अपडेट करना
    const { error: profileErr } = await supabaseAdmin.from("users_profile").upsert({
      phone: phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });
    if (profileErr) throw profileErr;

    const { error: authReqErr } = await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone: phone, temp_password: tempPassword, status: "success"
    });
    if (authReqErr) throw authReqErr;

    // 6. सक्सेस रिस्पॉन्स
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 🟢 Next.js को बताएँ कि दोनों मेथड्स सपोर्टेड हैं
export async function GET(req: Request) { return handleRequest(req); }
export async function POST(req: Request) { return handleRequest(req); }