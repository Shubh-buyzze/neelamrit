import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// यह फंक्शन GET और POST दोनों को हैंडल करेगा
async function handleTruecallerRequest(req: Request) {
  try {
    const url = new URL(req.url);
    let accessToken = "";
    let requestNonce = "";

    // 🟢 1. GET Request (Claude के अनुसार: Query Params में डेटा आना)
    if (req.method === "GET") {
      accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
      requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";
    } 
    // 🟢 2. POST Request (अगर Truecaller POST भेजता है)
    else if (req.method === "POST") {
      const textBody = await req.text();
      try {
        const payload = JSON.parse(textBody);
        accessToken = payload.accessToken || payload.token;
        requestNonce = payload.requestNonce || payload.requestId;
      } catch {
        const params = new URLSearchParams(textBody);
        accessToken = params.get("accessToken") || params.get("token") || "";
        requestNonce = params.get("requestNonce") || params.get("requestId") || "";
      }
    }

    // अगर डेटा नहीं मिला, तो वापस लॉगिन पेज पर भेज दें (अटकने से बचाने के लिए)
    if (!accessToken || !requestNonce) {
      return NextResponse.redirect(new URL('/login?error=Invalid_Truecaller_Payload', req.url));
    }

    // 3. Truecaller से असली प्रोफाइल मंगाएं
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tcRes.ok) {
       return NextResponse.redirect(new URL('/login?error=Truecaller_Token_Expired', req.url));
    }
    
    const profile = await tcRes.json();

    let phone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    phone = phone.replace("+91", "").trim();
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 4. Ghost Email & Password बनाएं
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@";

    // 5. Supabase Auth में यूज़र बनाएं/अपडेट करें
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

    // 6. Database में सेव करें
    await supabaseAdmin.from("users_profile").upsert({
      phone: phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });

    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone: phone, temp_password: tempPassword, status: "success"
    });

    // 7. 🟢 सक्सेस पेज पर Redirect करें!
    return NextResponse.redirect(new URL(`/truecaller-success?nonce=${requestNonce}`, req.url));

  } catch (err: any) {
    console.error("Truecaller Webhook Error:", err);
    return NextResponse.redirect(new URL(`/login?error=Server_Error_${err.message}`, req.url));
  }
}

// Next.js को बताएँ कि यह API GET और POST दोनों एक्सेप्ट करेगी
export async function GET(req: Request) {
  return handleTruecallerRequest(req);
}

export async function POST(req: Request) {
  return handleTruecallerRequest(req);
}