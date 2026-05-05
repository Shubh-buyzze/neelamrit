import { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./server";

export async function deductStock(
  supabase: SupabaseClient,
  orderId: string,
  orderItems: { product_id: string; quantity: number }[]
) {
  const errors: string[] = [];
  
  // ✅ Admin client use karo — RLS bypass hoga update ke liye
  const adminSupabase = await createAdminClient();

  for (const item of orderItems) {
    if (!item.product_id) {
      errors.push("Invalid Product ID in stock deduction request");
      continue;
    }

    // 1. Regular supabase se read karo (SELECT policy allow karti hai)
    const { data: inv, error: fetchError } = await supabase
      .from("inventory")
      .select("id, quantity, products(name)")
      .eq("product_id", item.product_id)
      .maybeSingle();

    if (fetchError || !inv) {
      errors.push(`Stock record not found for product: ${item.product_id}`);
      continue;
    }

    const productName = (inv.products as any)?.name || "Unknown Product";

    // 2. Stock check
    if (inv.quantity < item.quantity) {
      errors.push(`Insufficient stock for ${productName} (Available: ${inv.quantity})`);
      continue;
    }

    const newQuantity = inv.quantity - item.quantity;

    // 3. ✅ Admin client se UPDATE karo — RLS bypass
    const { error: updateError } = await adminSupabase
      .from("inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", item.product_id);

    if (updateError) {
      errors.push(`Failed to update stock for ${productName}: ${updateError.message}`);
      continue;
    }

    // 4. ✅ Admin client se log insert karo
    await adminSupabase.from("inventory_logs").insert([{
      product_id: item.product_id,
      change_type: "sale",
      quantity_change: -item.quantity,
      quantity_before: inv.quantity,
      quantity_after: newQuantity,
      order_id: orderId,
      note: `Automatic deduction for order ${orderId.slice(0, 8)}`,
    }]);
  }

  return { success: errors.length === 0, errors };
}

export async function restoreStock(
  supabase: SupabaseClient,
  orderId: string,
  orderItems: { product_id: string; quantity: number }[]
) {
  const adminSupabase = await createAdminClient();

  for (const item of orderItems) {
    if (!item.product_id) continue;

    const { data: inv } = await supabase
      .from("inventory")
      .select("id, quantity")
      .eq("product_id", item.product_id)
      .maybeSingle();

    if (!inv) continue;

    const newQuantity = inv.quantity + item.quantity;

    // ✅ Admin client se restore karo
    await adminSupabase
      .from("inventory")
      .update({
        quantity: newQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("product_id", item.product_id);

    await adminSupabase.from("inventory_logs").insert([{
      product_id: item.product_id,
      change_type: "cancelled",
      quantity_change: item.quantity,
      quantity_before: inv.quantity,
      quantity_after: newQuantity,
      order_id: orderId,
      note: `Stock restored for order ${orderId.slice(0, 8)}`,
    }]);
  }

  return { success: true };
}