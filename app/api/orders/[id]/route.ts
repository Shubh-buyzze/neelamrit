import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { restoreStock } from "@/lib/supabase/inventoryService";

export async function GET(
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

  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products ( id, name, price )
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (body.status !== "cancelled") {
    return NextResponse.json(
      { success: false, error: "Users can only cancel orders" },
      { status: 403 }
    );
  }

  // Order fetch karo with items
  const { data: existingOrder } = await supabase
    .from("orders")
    .select(`*, order_items ( product_id, quantity )`)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existingOrder) {
    return NextResponse.json(
      { success: false, error: "Order not found" },
      { status: 404 }
    );
  }

  if (existingOrder.status !== "pending") {
    return NextResponse.json(
      { success: false, error: "Only pending orders can be cancelled" },
      { status: 400 }
    );
  }

  // Status update karo
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  // ✅ Stock restore karo
  await restoreStock(supabase, id, existingOrder.order_items);

  return NextResponse.json({ success: true, data });
}