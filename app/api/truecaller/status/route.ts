import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🟢 THE FIX: Next.js को इस API को कैश करने से रोकें
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const nonce = searchParams.get("nonce");

    if (!nonce) return NextResponse.json({ status: "pending" });

    const { data, error } = await supabaseAdmin
      .from("tc_auth_requests")
      .select("status, phone, temp_password")
      .eq("nonce", nonce)
      .single();

    if (error || !data) {
      return NextResponse.json({ status: "pending" });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ status: "pending" });
  }
}