import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nonce = searchParams.get("nonce");

  if (!nonce) return NextResponse.json({ status: "pending" });

  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, temp_password")
    .eq("nonce", nonce)
    .single();

  if (error || !data) return NextResponse.json({ status: "pending" });

  return NextResponse.json(data); // Returns status: "success" with credentials
}