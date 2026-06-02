/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/api/truecaller/status/route.ts                           ║
 * ║  Ultra-Fast Polling Endpoint                                             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ status: "pending", error: "Missing Env" }, { headers: NO_CACHE_HEADERS });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { searchParams } = new URL(req.url);
    const nonce = searchParams.get("nonce");

    if (!nonce) {
      return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
    }

    const { data, error } = await supabase
      .from("tc_auth_requests")
      .select("status, phone, temp_password, is_new_user")
      .eq("nonce", nonce)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
  }
}