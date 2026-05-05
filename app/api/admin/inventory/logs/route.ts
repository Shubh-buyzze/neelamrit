import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

export async function GET(req: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("product_id");

  let query = supabase!
    .from("inventory_logs")
    .select(`
      *,
      products ( name )
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}