import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();

  // 1. Authenticated user fetch karo
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

  // 2. users_profile se poora profile fetch karo
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

  // 3. Email priority logic:
  //    - users_profile.email  → user ka real email (manually bhara hua)
  //    - user.email           → Auth ka ghost email (phone@neelamrit.com)
  //
  // Ghost email pehchanne ka tarika: "@neelamrit.com" se end hota hai
  // Agar profile mein real email nahi hai, aur Auth email ghost hai
  // → frontend ko "" dikhao taaki "Not provided" show ho, ghost email nahi
  const authEmail   = user.email ?? "";
  const isGhostEmail = authEmail.endsWith("@neelamrit.com");

  // users_profile.email = real email (agar kabhi save hua ho)
  const realEmail = profileData?.email ?? "";

  // Frontend ko yahi email dikhao:
  // 1. users_profile mein real email hai → wahi dikhao
  // 2. Auth email real hai (ghost nahi, manual signup) → wahi dikhao
  // 3. Ghost email hai aur profile mein bhi kuch nahi → empty string
  const displayEmail =
    realEmail ||
    (!isGhostEmail ? authEmail : "");

  return NextResponse.json({
    success: true,
    data: {
      ...(profileData || {}),
      // ✅ FIX: email field mein hamesha real email aayega
      // Ghost email kabhi frontend tak nahi pahunchega
      email: displayEmail,
    },
  });
}

export async function PUT(req: Request) {
  const supabase = await createServerSupabase();

  // 1. User logged in hai confirm karo
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
    // 2. Frontend se data parse karo
    const body = await req.json();
    const { full_name, phone, email } = body;

    if (!full_name || full_name.trim() === "") {
      return NextResponse.json(
        { success: false, error: "Full name is required" },
        { status: 400 }
      );
    }

    // 3. Upsert payload banao
    const upsertPayload: Record<string, any> = {
      id:         user.id,
      full_name:  full_name.trim(),
      phone:      phone?.trim() || null,
      updated_at: new Date().toISOString(),
    };

    // Email sirf tab save karo jab user ne real email diya ho
    // Ghost email kabhi users_profile mein save mat karo
    if (email && email.trim() && !email.trim().endsWith("@neelamrit.com")) {
      upsertPayload.email = email.trim();
    }

    // 4. Profile update karo
    const { data, error } = await supabase
      .from("users_profile")
      .upsert(upsertPayload)
      .select()
      .single();

    if (error) throw error;

    // 5. Response mein bhi ghost email filter karo
    const savedEmail    = data?.email ?? "";
    const authEmail     = user.email  ?? "";
    const isGhost       = authEmail.endsWith("@neelamrit.com");
    const responseEmail = savedEmail || (!isGhost ? authEmail : "");

    return NextResponse.json({
      success: true,
      data: { ...data, email: responseEmail },
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}