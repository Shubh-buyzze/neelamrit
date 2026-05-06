import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin Client: RLS बायपास करने के लिए Service Role Key का इस्तेमाल
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// यह फंक्शन GET और POST दोनों तरह की रिक्वेस्ट को हैंडल करेगा
async function handleTruecallerRequest(req: Request) {
  try {
    const url = new URL(req.url);
    let accessToken = "";
    let requestNonce = "";

    // 🟢 1. Extract Data (GET या POST दोनों के लिए सपोर्ट)
    if (req.method === "GET") {
      accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
      requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";
    } 
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

    // अगर टोकन नहीं मिला तो एरर के साथ लॉगिन पेज पर वापस भेजें
    if (!accessToken || !requestNonce) {
      return NextResponse.redirect(new URL('/login?error=payload_missing', req.url));
    }

    // 🟢 2. Fetch Profile from Truecaller
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tcRes.ok) {
       return NextResponse.redirect(new URL('/login?error=truecaller_token_expired', req.url));
    }
    
    const profile = await tcRes.json();

    // 🟢 3. Safe Phone Parsing (ताकि replace() से सर्वर क्रैश न हो)
    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 🟢 4. Setup Ghost Account Credentials
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";

    // 🟢 5. Create or Update User in Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ghostEmail,
      password: tempPassword,
      email_confirm: true,
    });

    // अगर यूज़र पहले से है, तो बस उसका पासवर्ड अपडेट करें
    if (authError && authError.message.includes("already exists")) {
      const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = usersData.users.find(u => u.email === ghostEmail);
      if (existingUser) {
         await supabaseAdmin.auth.admin.updateUserById(existingUser.id, { password: tempPassword });
      }
    }

    // 🟢 6. Update Database Tables
    // Profile टेबल अपडेट करें
    await supabaseAdmin.from("users_profile").upsert({
      phone: phone, 
      full_name: fullName, 
      role: "customer"
    }, { onConflict: "phone" });

    // Auth Requests टेबल में स्टेटस 'success' करें
    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, 
      phone: phone, 
      temp_password: tempPassword, 
      status: "success"
    });

    // 🟢 7. Redirect to Success Page (यहाँ से फ्रंटएंड टेकओवर करेगा)
    const redirectUrl = new URL(`/truecaller-success?nonce=${requestNonce}`, req.url);
    return NextResponse.redirect(redirectUrl);

  } catch (err: any) {
    console.error("Truecaller Webhook Error:", err);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}

// Next.js को बताएँ कि यह API GET और POST दोनों मेथड एक्सेप्ट करेगी
export async function GET(req: Request) { return handleTruecallerRequest(req); }
export async function POST(req: Request) { return handleTruecallerRequest(req); }