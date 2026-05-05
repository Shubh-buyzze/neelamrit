import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  // Total orders
  const { count: totalOrders } = await supabase!
    .from("orders")
    .select("*", { count: "exact", head: true });

  // Pending orders
  const { count: pendingOrders } = await supabase!
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  // Total revenue
  const { data: revenueData } = await supabase!
    .from("orders")
    .select("total_amount")
    .neq("status", "cancelled");

  const totalRevenue =
    revenueData?.reduce((sum, o) => sum + Number(o.total_amount), 0) ?? 0;

  // Total products
  const { count: totalProducts } = await supabase!
    .from("products")
    .select("*", { count: "exact", head: true });

  // Total customers
  const { count: totalCustomers } = await supabase!
    .from("users_profile")
    .select("*", { count: "exact", head: true })
    .eq("role", "customer");

  // ✅ Inventory stats
  const { data: invData } = await supabase!
    .from("inventory")
    .select("quantity, low_stock_threshold");

  const lowStockCount =
    invData?.filter(
      (i) => i.quantity <= i.low_stock_threshold && i.quantity > 0
    ).length ?? 0;

  const outOfStockCount =
    invData?.filter((i) => i.quantity === 0).length ?? 0;

  // ✅ Today's orders
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: todayOrders } = await supabase!
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // ✅ Today's revenue
  const { data: todayRevenueData } = await supabase!
    .from("orders")
    .select("total_amount")
    .gte("created_at", todayStart.toISOString())
    .neq("status", "cancelled");

  const todayRevenue =
    todayRevenueData?.reduce(
      (sum, o) => sum + Number(o.total_amount), 0
    ) ?? 0;

  return NextResponse.json({
    success: true,
    data: {
      totalOrders: totalOrders ?? 0,
      pendingOrders: pendingOrders ?? 0,
      totalRevenue,
      totalProducts: totalProducts ?? 0,
      totalCustomers: totalCustomers ?? 0,
      // Inventory
      lowStockCount,
      outOfStockCount,
      // Today
      todayOrders: todayOrders ?? 0,
      todayRevenue,
    },
  });
}