import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request, 
  // 🟢 1. params का टाइप Promise में बदला
  { params }: { params: Promise<{ id: string }> } 
) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const reason = body.reason || "No reason provided";

    // 🟢 2. params को इस्तेमाल करने से पहले await किया (Next.js 15 strict rule)
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    // ✅ Naya RPC function call kiya
    const { data, error } = await supabase.rpc("request_cancel_order", {
      p_order_id: orderId, // 🟢 3. यहाँ params.id की जगह orderId पास किया
      p_user_id: user.id,
      p_reason: reason
    });

    if (error) {
      console.error("Cancel Request Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}