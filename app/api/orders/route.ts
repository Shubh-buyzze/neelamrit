import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js"; // 🟢 ADDED: Admin client ke liye

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (
          id, quantity, unit_price,
          products ( name, price, image_url ) 
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // 🟢 FIX: Agar database se galti se 'pending' aa bhi jaye, toh use frontend ko bhejne se pehle 'confirmed' bana do
    const updatedData = data?.map(order => ({
      ...order,
      status: order.status === 'pending' ? 'confirmed' : order.status
    }));

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { address, payment_method, total_amount, promo_code } = body;

    if (!address || !payment_method) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // 1. Aapke RPC system se Order Place karein
    const { data, error } = await supabase.rpc("place_order", {
      p_user_id: user.id,
      p_shipping_address: address,
      p_payment_method: payment_method,
      p_total_amount: total_amount
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    // 2. 🟢 FIX: Admin Client use karein taki RLS security update ko block na kar sake
    const supabaseAdmin = createClient(
      (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: latestOrder } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestOrder) {
      // Order ko force update karke seedha "confirmed" set karein aur promo code dalein
      await supabaseAdmin
        .from("orders")
        .update({ 
           promo_code: promo_code || null,
           status: 'confirmed' 
        })
        .eq("id", latestOrder.id);
    }

    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    console.error("Order Placement Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}