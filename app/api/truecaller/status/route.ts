/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/api/truecaller/status/route.ts                          ║
 * ║  Frontend yahan poll karta hai har 2s mein                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// 🟢 SPEED OPTIMIZATION: Edge Runtime enabled for zero-latency polling
export const dynamic    = "force-dynamic";
export const revalidate = 0;

// These headers prevent ALL layers of caching: Next.js, CDN, browser
const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma:          "no-cache",
  Expires:         "0",
  "Surrogate-Control": "no-store",
};

export async function GET(req: Request) {
  // 🟢 MAIN FIX: Supabase client ab function ke ANDAR banega
  // Isse build time par variables ki zaroorat nahi padegi aur crash nahi hoga.
  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { searchParams } = new URL(req.url);
  const nonce = searchParams.get("nonce");

  // No nonce → still pending
  if (!nonce) {
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
  }

  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, temp_password, is_new_user")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) {
    console.error("[TC-Status] DB error:", error.message);
    // Return pending on DB error — don't break the poll loop
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
  }

  // Row not yet created by webhook → pending
  if (!data) {
    return NextResponse.json({ status: "pending" }, { headers: NO_CACHE_HEADERS });
  }

  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}