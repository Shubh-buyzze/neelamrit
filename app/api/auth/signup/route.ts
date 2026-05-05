import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { full_name, phone, email, password } = await req.json();

  if (!full_name || !phone || !email || !password) {
    return NextResponse.json(
      { success: false, error: "All fields are required" },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabase();

  // Signup with metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name, phone }, // trigger function ye use karega
    },
  });

  if (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  // Agar trigger kaam na kare to manually profile save karo
  if (data.user) {
    const adminSupabase = await createAdminClient();
    await adminSupabase
      .from("users_profile")
      .upsert({
        id: data.user.id,
        full_name: full_name.trim(),
        phone: phone.trim(),
      });
  }

  return NextResponse.json({ success: true });
}