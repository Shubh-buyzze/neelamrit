import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// 🟢 GET: Fetch User Orders for "My Orders" Page
export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Check User Session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch only THIS user's orders with items and product details
    // ⚠️ IMPORTANT: "image_url" को अपने products table के कॉलम नाम से बदलें (अगर वो 'image' या 'images' है तो)
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

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Fetch Orders Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// 🟢 POST: Securely Place Order using Database RPC
export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const { address, payment_method, total_amount } = body;

    if (!address || !payment_method) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("place_order", {
      p_user_id: user.id,
      p_shipping_address: address,
      p_payment_method: payment_method,
      p_total_amount: total_amount
    });

    if (error) {
      console.error("RPC Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: data });

  } catch (error: any) {
    console.error("Order Placement Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}