import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

// GET — all inventory with low stock flag
export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("inventory")
    .select(`
      *,
      products ( id, name, price )
    `)
    .order("quantity", { ascending: true });

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  // Low stock flag add karo
  const enriched = data?.map((item) => ({
    ...item,
    is_low_stock: item.quantity <= item.low_stock_threshold,
    is_out_of_stock: item.quantity === 0,
  }));

  const lowStockCount = enriched?.filter((i) => i.is_low_stock).length ?? 0;
  const outOfStockCount = enriched?.filter((i) => i.is_out_of_stock).length ?? 0;

  return NextResponse.json({
    success: true,
    data: enriched,
    summary: { lowStockCount, outOfStockCount },
  });
}