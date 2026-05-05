import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();

  // 1. Get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json(
      { success: false, error: "Not logged in" },
      { status: 401 }
    );
  }

  // 2. Fetch the user's profile from the public.users_profile table
  // Using maybeSingle() prevents crashes if the row doesn't exist yet
  const { data: profileData, error: profileError } = await supabase
    .from("users_profile")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { success: false, error: profileError.message },
      { status: 500 }
    );
  }

  // 3. Return combined data (profile info + auth email)
  return NextResponse.json({
    success: true,
    data: {
      ...(profileData || {}),
      email: user.email,
    },
  });
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabase();

  // 1. Verify user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // 2. Parse the incoming data from the frontend
    const body = await req.json();
    const { full_name, phone } = body;

    if (!full_name || full_name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Full name is required" },
        { status: 400 }
      );
    }

    // 3. Upsert (Update if exists, Insert if new) the profile data
    const { data, error } = await supabase
      .from("users_profile")
      .upsert({
        id: user.id,
        full_name: full_name.trim(),
        phone: phone?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}