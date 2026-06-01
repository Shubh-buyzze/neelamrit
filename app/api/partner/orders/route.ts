import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    // 1. Get partner's promo code securely
    const { data: partner } = await supabase
      .from("partners")
      .select("promo_code")
      .eq("user_id", user.id)
      .single();
    
    if (!partner) return NextResponse.json({ success: false, error: "Not a partner" }, { status: 403 });

    // 2. 🟢 FIX: Use Admin Client to bypass RLS and fetch customer orders
    const supabaseAdmin = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, total_amount, created_at")
      .eq("promo_code", partner.promo_code)
      .order("created_at", { ascending: false }); // Latest orders first

    if (error) throw error;

    return NextResponse.json({ success: true, data: orders || [] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}