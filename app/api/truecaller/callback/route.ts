import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

async function handleTruecallerRequest(req: Request) {
  try {
    const url = new URL(req.url);
    let accessToken = "";
    let requestNonce = "";

    // 1. Get request Data
    if (req.method === "GET") {
      accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
      requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";
    } else if (req.method === "POST") {
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

    if (!accessToken || !requestNonce) {
      return NextResponse.redirect(new URL('/login?error=Invalid_Truecaller_Payload', req.url));
    }

    // 2. Fetch Profile from Truecaller
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tcRes.ok) {
       return NextResponse.redirect(new URL('/login?error=Truecaller_Token_Expired', req.url));
    }
    
    const profile = await tcRes.json();

    // 🟢 THE FIX IS HERE 🟢
    // Phone number को String में बदलकर ही replace लगाएँ, ताकि सर्वर क्रैश न हो।
    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 3. Ghost Email & Temp Password
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-8) + "Aa1@";

    // 4. Create or Update User in Supabase
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

    // 5. Update Database Tables
    await supabaseAdmin.from("users_profile").upsert({
      phone: phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });

    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone: phone, temp_password: tempPassword, status: "success"
    });

    // 6. Redirect to Success Page
    return NextResponse.redirect(new URL(`/truecaller-success?nonce=${requestNonce}`, req.url));

  } catch (err: any) {
    console.error("Truecaller Webhook Error:", err);
    // कोई भी एरर आये तो लॉगिन पेज पर एरर मैसेज के साथ भेज दें
    return NextResponse.redirect(new URL(`/login?error=Server_Error`, req.url));
  }
}

export async function GET(req: Request) {
  return handleTruecallerRequest(req);
}

export async function POST(req: Request) {
  return handleTruecallerRequest(req);
}