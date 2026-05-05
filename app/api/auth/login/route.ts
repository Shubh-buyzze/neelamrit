import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const supabase = await createServerSupabase();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: data.user,
  });
}