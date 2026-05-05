import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// GET — profile fetch karo
export async function GET() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      email: user.email, // auth se email le lo
    },
  });
}

// PUT — profile update karo
export async function PUT(req: Request) {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const { full_name, phone } = body;

  // Validate karo
  if (!full_name || full_name.trim() === "") {
    return NextResponse.json(
      { success: false, error: "Full name is required" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("users_profile")
    .upsert({
      id: user.id,
      full_name: full_name.trim(),
      phone: phone?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data });
}