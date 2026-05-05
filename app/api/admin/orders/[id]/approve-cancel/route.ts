import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request, 
  // 🟢 1. params का टाइप Promise में बदला
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    
    // Check if Admin
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("users_profile").select("role").eq("id", user?.id || "").single();
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 🟢 2. params को इस्तेमाल करने से पहले await किया (Next.js 15 strict rule)
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // Call the Admin RPC to finalize cancellation & restore stock
    const { data, error } = await supabase.rpc("admin_approve_cancellation", {
      p_order_id: orderId // 🟢 3. यहाँ params.id की जगह orderId पास किया
    });

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}