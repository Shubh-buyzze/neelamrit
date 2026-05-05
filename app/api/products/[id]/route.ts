import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabase = await createServerSupabase(); // ← await added

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data });
}