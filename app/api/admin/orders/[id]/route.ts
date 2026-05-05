import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/adminCheck";

// Admin order status update function
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  // requireAdmin() ab Service Role wala client return karega
  const { error: authError, supabase } = await requireAdmin();
  
  if (authError || !supabase) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Admin access required" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { status } = body;

    // Status validation
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Updating order in database
    const { data, error: dbError } = await supabase
      .from("orders")
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (dbError) {
      console.error("Database Update Error:", dbError.message);
      return NextResponse.json(
        { success: false, error: dbError.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "Order not found or update failed due to permissions" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (err) {
    console.error("Internal Server Error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}