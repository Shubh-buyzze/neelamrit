import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// PUT — Update an existing address
export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { 
      full_name, 
      phone, 
      address_line1, 
      address_line2, 
      city, 
      state, 
      pincode, 
      district, 
      country 
    } = body;

    const { data, error } = await supabase
      .from("shipping_addresses")
      .update({
        full_name, 
        phone, 
        address_line1,
        address_line2: address_line2 ?? null,
        city, 
        state, 
        pincode,
        district: district ?? null,
        country: country ?? 'India',
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id) // Security check to ensure user owns this address
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE — Delete an address
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { error } = await supabase
      .from("shipping_addresses")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id); // Security check

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PATCH — Set address as default
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // First, remove the default status from all of this user's addresses
    await supabase
      .from("shipping_addresses")
      .update({ is_default: false })
      .eq("user_id", user.id);

    // Then, set the selected address as the new default
    const { data, error } = await supabase
      .from("shipping_addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}