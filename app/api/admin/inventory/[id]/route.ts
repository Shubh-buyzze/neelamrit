import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { quantity, note, change_type, operation } = body;

  if (!quantity || Number(quantity) <= 0) {
    return NextResponse.json(
      { success: false, error: "Valid quantity required" },
      { status: 400 }
    );
  }

  const { data: inv } = await supabase!
    .from("inventory")
    .select("quantity, product_id")
    .eq("id", id)
    .single();

  if (!inv) {
    return NextResponse.json(
      { success: false, error: "Inventory record not found" },
      { status: 404 }
    );
  }

  // ✅ Teeno operations — set, add, subtract
  let newQuantity: number;
  let actualChangeType: string;
  let quantityChange: number;

  switch (operation) {
    case "set":
      newQuantity = Number(quantity);
      quantityChange = newQuantity - inv.quantity;
      actualChangeType = "manual_adjust";
      break;
    case "subtract":
      newQuantity = Math.max(0, inv.quantity - Number(quantity));
      quantityChange = -(inv.quantity - newQuantity);
      actualChangeType = change_type || "damaged";
      break;
    default: // "add" or restock
      newQuantity = inv.quantity + Number(quantity);
      quantityChange = Number(quantity);
      actualChangeType = change_type || "restock";
  }

  const { data, error: updateError } = await supabase!
    .from("inventory")
    .update({
      quantity: newQuantity,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  await supabase!.from("inventory_logs").insert([{
    product_id: inv.product_id,
    change_type: actualChangeType,
    quantity_change: quantityChange,
    quantity_before: inv.quantity,
    quantity_after: newQuantity,
    note: note || `${actualChangeType} by admin`,
  }]);

  return NextResponse.json({ success: true, data });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { low_stock_threshold } = await req.json();

  const { data, error: updateError } = await supabase!
    .from("inventory")
    .update({ low_stock_threshold })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json(
      { success: false, error: updateError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}