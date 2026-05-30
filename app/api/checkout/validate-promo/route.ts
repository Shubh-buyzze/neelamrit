import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ success: false, message: "Code is required" });
    }

    const supabase = await createServerSupabase();
    
    // 1. Logged-in customer ki details nikalna
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Check karo ki kya promo code partners table me exist karta hai
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .select("promo_code")
      .ilike("promo_code", code.trim())
      .maybeSingle();

    if (partnerError || !partner) {
      return NextResponse.json({ success: false, message: "Invalid or inactive partner code." });
    }

    // 3. Check karo ki kya IS specific customer ne pehle kabhi ye code use kiya hai
    let alreadyUsed = false;
    if (user) {
      const { data: existingOrder } = await supabaseAdmin
        .from("orders")
        .select("id")
        .eq("user_id", user.id)
        .ilike("promo_code", partner.promo_code)
        .limit(1)
        .maybeSingle();

      if (existingOrder) {
        alreadyUsed = true; // Agar order mil gaya matlab customer pehle use kar chuka hai
      }
    }

    return NextResponse.json({ 
      success: true, 
      code: partner.promo_code,
      alreadyUsed: alreadyUsed // Frontend ko flag pass kar rahe hain
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}