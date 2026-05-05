import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("orders")
    .select(`
      *,
      order_items (
        *,
        products ( name, price )
      )
    `)
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}