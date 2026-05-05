import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

export async function GET() {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const { data, error: dbError } = await supabase!
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) {
    return NextResponse.json(
      { success: false, error: dbError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const { error, supabase } = await requireAdmin();
  if (error) return error;

  const body = await req.json();
  const { name, price, description } = body;

  if (!name || !price) {
    return NextResponse.json(
      { success: false, error: "Name and price are required" },
      { status: 400 }
    );
  }

  const { data, error: dbError } = await supabase!
    .from("products")
    .insert([{ name, price: Number(price), description: description ?? null }])
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