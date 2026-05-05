// app/api/cart/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { addToCartSchema } from "@/lib/validations/cart";

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Added image_url to products select
    const { data, error } = await supabase
      .from("cart")
      .select(`
        id, 
        product_id, 
        quantity, 
        products (id, name, price, image_url)
      `)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: "Please login to add items to cart" }, { status: 401 });
    }

    const body = await req.json();
    
    const validation = addToCartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: validation.error.errors[0].message 
      }, { status: 400 });
    }

    const { product_id, quantity } = validation.data;

    const { data: existingItem } = await supabase
      .from("cart")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .single();

    if (existingItem) {
      const { data, error } = await supabase
        .from("cart")
        .update({ quantity: existingItem.quantity + quantity })
        .eq("id", existingItem.id)
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ success: true, data });
    } else {
      const { data, error } = await supabase
        .from("cart")
        .insert([{ user_id: user.id, product_id, quantity }])
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, data });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}