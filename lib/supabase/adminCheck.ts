import { createServerSupabase, createAdminClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function requireAdmin() {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      ),
      user: null,
      supabase: null,
    };
  }

  // ✅ Admin client se profile check karo — RLS issue nahi hoga
  const adminClient = await createAdminClient();

  const { data: profile } = await adminClient
    .from("users_profile")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return {
      error: NextResponse.json(
        { success: false, error: "Forbidden — Admin only" },
        { status: 403 }
      ),
      user: null,
      supabase: null,
    };
  }

  return { error: null, user, supabase: adminClient };
}