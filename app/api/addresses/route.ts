import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET — saare addresses fetch karo
export async function GET() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("shipping_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

// POST — naya address add karo
export async function POST(req: Request) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = body;

  // Validate required fields
  if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
    return NextResponse.json(
      { success: false, error: "All required fields must be filled" },
      { status: 400 }
    );
  }

  // Agar ye default address hai to pehle baki sab ka default hatao
  if (is_default) {
    await supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  // Pehla address automatically default hoga
  const { data: existingAddresses } = await supabase
    .from("shipping_addresses")
    .select("id")
    .eq("user_id", user.id);

  const isFirstAddress = !existingAddresses || existingAddresses.length === 0;

  const { data, error } = await supabase
    .from("shipping_addresses")
    .insert([{
      user_id: user.id,
      full_name: full_name.trim(),
      phone: phone.trim(),
      address_line1: address_line1.trim(),
      address_line2: address_line2?.trim() ?? null,
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      is_default: isFirstAddress ? true : (is_default ?? false),
    }])
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}