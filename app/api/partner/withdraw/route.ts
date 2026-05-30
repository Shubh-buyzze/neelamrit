import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const { data: partner } = await supabase.from("partners").select("promo_code").eq("user_id", user.id).single();
    if (!partner) return NextResponse.json({ success: false, error: "Not a partner" }, { status: 403 });

    // 🟢 FIX: Use Admin Client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: deliveredOrders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("promo_code", partner.promo_code)
      .eq("status", "delivered");

    const COMMISSION_PER_ORDER = 15; 
    const earnings = (deliveredOrders?.length || 0) * COMMISSION_PER_ORDER;

    if (earnings < 500) {
      return NextResponse.json({ 
        success: false, 
        error: `Minimum withdrawal limit is ₹500. Your current balance is ₹${earnings}.` 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Withdrawal request submitted! Amount will be transferred within 24-48 hours." 
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}