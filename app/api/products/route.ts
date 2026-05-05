import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase(); // ← await added

  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = await createServerSupabase(); // ← await added

  const { data, error } = await supabase
    .from("products")
    .insert([body])
    .select(); // ← added so inserted product is returned

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true, data });
}