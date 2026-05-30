import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

// Auto Code Generator Logic
async function generateUniqueCode(supabase: any, name: string) {
  // Naam se aage ke letters nikalna, special characters hatana
  const prefix = name.replace(/[^a-zA-Z]/g, '').substring(0, 5).toUpperCase() || "NEEL";
  let isUnique = false;
  let code = "";

  while (!isUnique) {
    const random = Math.floor(10 + Math.random() * 90); // 10 se 99 tak random number
    code = `${prefix}${random}`;
    
    // Check in database
    const { data } = await supabase.from("partners").select("promo_code").eq("promo_code", code).maybeSingle();
    if (!data) isUnique = true;
  }
  return code;
}

export async function POST(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const { name, email, phone, upi_id } = await req.json();

    if (!name || !upi_id) {
      return NextResponse.json({ success: false, error: "Name and UPI ID are required" }, { status: 400 });
    }

    const promo_code = await generateUniqueCode(supabase, name);

    // Insert to DB mapping user.id exactly
    const { data, error } = await supabase
      .from("partners")
      .insert({
        user_id: user.id,
        name,
        email,
        phone,
        upi_id,
        promo_code
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}