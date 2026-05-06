import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  try {
    const textBody = await req.text();
    let accessToken = "";
    let requestNonce = "";

    // 🟢 Extract Data safely (GET or POST)
    try {
      const payload = JSON.parse(textBody);
      accessToken = payload.accessToken || payload.token;
      requestNonce = payload.requestNonce || payload.requestId;
    } catch {
      const params = new URLSearchParams(textBody);
      accessToken = params.get("accessToken") || params.get("token") || "";
      requestNonce = params.get("requestNonce") || params.get("requestId") || "";
    }

    if (!accessToken || !requestNonce) {
      return NextResponse.json({ success: false, error: "Missing payload" });
    }

    // 🟢 Fetch Profile
    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await tcRes.json();

    // 🟢 Safe Phone Parsing
    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    // 🟢 Ghost Account
    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = Math.random().toString(36).slice(-10) + "Aa1!";

    // 🟢 Create User in Auth
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: ghostEmail, password: tempPassword, email_confirm: true,
    });

    if (authError && authError.message.includes("already exists")) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const user = list.users.find(u => u.email === ghostEmail);
      if (user) await supabaseAdmin.auth.admin.updateUserById(user.id, { password: tempPassword });
    }

    // 🟢 Save to Database
    await supabaseAdmin.from("users_profile").upsert({
      phone, full_name: fullName, role: "customer"
    }, { onConflict: "phone" });

    await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, phone, temp_password: tempPassword, status: "success"
    });

    // 🟢 Background response (No redirect needed here)
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token") || "";
  const requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId") || "";
  
  // Create a fake request to pass to POST logic
  const mockReq = new Request(req.url, {
    method: 'POST',
    body: JSON.stringify({ accessToken, requestNonce })
  });
  return POST(mockReq);
}