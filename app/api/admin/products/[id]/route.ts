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
  const { name, price, description } = body;

  const { data, error: dbError } = await supabase!
    .from("products")
    .update({ name, price: Number(price), description: description ?? null })
    .eq("id", id)
    .select()
    .single();

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { error: dbError } = await supabase!
    .from("products")
    .delete()
    .eq("id", id);

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}