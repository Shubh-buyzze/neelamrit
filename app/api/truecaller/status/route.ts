/**
 * FILE: src/app/api/truecaller/status/route.ts
 *
 * Frontend polls this every 2s to check if Truecaller webhook has processed login.
 * Returns: { status, phone, temp_password, is_new_user }
 *
 * force-dynamic + no-store headers = zero caching (prevents "pending" stuck bug)
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic    = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const NO_CACHE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma:          "no-cache",
  Expires:         "0",
};

export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get("nonce");

  if (!nonce) {
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE });
  }

  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, temp_password, is_new_user")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) console.error("[TC-Status] DB error:", error);

  return NextResponse.json(
    data ?? { status: "pending" },
    { headers: NO_CACHE }
  );
}