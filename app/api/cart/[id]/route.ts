// app/api/cart/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await req.json();
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("cart")
    .update({ quantity: body.quantity })
    .eq("id", id)
    .eq("user_id", user.id)
    .select();

  if (error) {
    return NextResponse.json({ success: false, error: error.message });
  }

  return NextResponse.json({ success: true, data });
}