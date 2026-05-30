import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ success: false, error: "Not logged in" }, { status: 401 });
  }

  // Check if user exists in partners table
  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data) {
    return NextResponse.json({ success: true, isPartner: true, data });
  }
  
  return NextResponse.json({ success: true, isPartner: false });
}