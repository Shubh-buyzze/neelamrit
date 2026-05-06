import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get("nonce");
  if (!nonce) return NextResponse.json({ status: "pending" });

  const { data, error } = await supabaseAdmin
    .from("tc_auth_requests")
    .select("status, phone, temp_password")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error || !data) return NextResponse.json({ status: "pending" });
  return NextResponse.json(data);
}