/**
 * FILE: src/app/api/auth/truecaller/status/route.ts
 *
 * Frontend polls this every 2s after triggering Truecaller deeplink.
 * Returns: { status, phone, temp_password, is_new_user }
 *
 * CRITICAL: force-dynamic + no-store headers prevent ALL caching.
 * Without this, Next.js serves cached "pending" forever → polling stuck.
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic   = "force-dynamic";
export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma:          "no-cache",
  Expires:         "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get("nonce");

  if (!nonce) {
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
  }

  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, temp_password, is_new_user")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) console.error("[TC-Status] DB error:", error);

  return NextResponse.json(
    data ?? { status: "pending" },
    { headers: NO_CACHE_HEADERS }
  );
}