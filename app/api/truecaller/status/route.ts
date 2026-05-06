import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// RLS बायपास करने के लिए Service Role Key का इस्तेमाल (Frontend को पासवर्ड देने के लिए)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nonce = searchParams.get("nonce");

    if (!nonce) {
      return NextResponse.json({ status: "error", message: "Nonce is required" });
    }

    // डेटाबेस से क्रेडेंशियल्स निकालें
    const { data, error } = await supabaseAdmin
      .from("tc_auth_requests")
      .select("status, phone, temp_password")
      .eq("nonce", nonce)
      .single();

    // अगर डेटा नहीं मिला या एरर है, तो 'pending' भेजें ताकि फ्रंटएंड इंतज़ार करे
    if (error || !data) {
      return NextResponse.json({ status: "pending" });
    }

    // अगर सक्सेस है, तो पासवर्ड और फ़ोन नंबर फ्रंटएंड को भेज दें
    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Status API Error:", err);
    return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
  }
}