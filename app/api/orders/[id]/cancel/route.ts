import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(
  req: Request, 
  // 🟢 1. params का टाइप Promise में बदला (Next.js 15 Requirement)
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Session check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // 🟢 2. params को इस्तेमाल करने से पहले await किया
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    
    // 2. ⚡ SMART JSON PARSING (Fix for the crash)
    let reason = "No reason provided by user.";
    try {
      // Pehle as a text padho, agar khali nahi hai tabhi JSON mein convert karo
      const text = await req.text();
      if (text) {
        const body = JSON.parse(text);
        if (body.reason) {
          reason = body.reason;
        }
      }
    } catch (parseError) {
      console.log("Empty or invalid JSON body, using default reason.");
    }

    // 3. Call the Database RPC with p_reason
    const { data, error } = await supabase.rpc("cancel_order", {
      p_order_id: orderId,
      p_user_id: user.id,
      p_reason: reason
    });

    if (error) {
      console.error("Cancel RPC Error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Cancellation Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}