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

    if (!accessToken || !requestNonce) return NextResponse.json({ success: false, error: "Missing tokens" });

    const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!tcRes.ok) throw new Error("Truecaller Token Expired or Invalid");
    
    const profile = await tcRes.json();

    const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
    const phone = String(rawPhone).replace("+91", "").trim(); 
    const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();

    const ghostEmail = `${phone}@neelamrit.com`;
    const tempPassword = "Tc_" + Math.random().toString(36).slice(-10) + "Z9!";

    let userId = "";

    // 🟢 1. सबसे पहले चेक करें कि क्या प्रोफाइल पहले से मौजूद है
    const { data: existingProfile } = await supabaseAdmin
      .from("users_profile")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (existingProfile && existingProfile.id) {
      userId = existingProfile.id;
      // अगर यूज़र है, तो Auth में उसका पासवर्ड अपडेट करें
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
    } else {
      // 🟢 2. अगर प्रोफाइल नहीं है, तो नया Auth User बनाएँ
      const { data: newAuthData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: ghostEmail,
        password: tempPassword,
        email_confirm: true,
      });

      if (createError) {
        // (Fallback) अगर यूज़र Auth में है पर प्रोफाइल नहीं बनी थी
        const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
        const fallbackUser = userList.users.find(u => u.email === ghostEmail);
        if (fallbackUser) {
          userId = fallbackUser.id;
          await supabaseAdmin.auth.admin.updateUserById(userId, { password: tempPassword });
        } else {
          throw createError;
        }
      } else {
        userId = newAuthData.user.id;
      }
    }

    // 🟢 3. ID मिल गई! अब बिना क्रैश हुए Profile अपडेट करें
    const { error: profileError } = await supabaseAdmin.from("users_profile").upsert({
      id: userId,
      phone: phone,
      full_name: fullName,
      role: "customer"
    });
    if (profileError) throw profileError;

    // 🟢 4. फ्रंटएंड के लिए स्टेटस सेव करें
    const { error: stError } = await supabaseAdmin.from("tc_auth_requests").upsert({
      nonce: requestNonce, 
      phone: phone, 
      temp_password: tempPassword, 
      status: "success"
    });
    if (stError) throw stError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function GET(req: Request) { return POST(req); }