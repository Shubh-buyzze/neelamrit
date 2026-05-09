import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get("nonce");

  if (!nonce) {
    return NextResponse.json({ status: "pending", error: "No nonce provided" }, {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache", Expires: "0" },
    });
  }

  // 🟢 'email' को सेलेक्ट किया जा रहा है
  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, email, temp_password") 
    .eq("nonce", nonce)
    .maybeSingle();

  return NextResponse.json(data ?? { status: "pending" }, {
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate", Pragma: "no-cache", Expires: "0", "Surrogate-Control": "no-store" },
  });
}