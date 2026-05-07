/**
 * TRUECALLER STATUS POLLING API
 * Path: /api/auth/truecaller/status/route.ts
 *
 * Frontend polls this every 2s to check if webhook has processed the login.
 * Returns: { status: "pending" | "success", phone: string, temp_password: string }
 */

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// CRITICAL: Disable all Next.js caching on this route.
// Without this, Next.js returns the first cached "pending" response forever.
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
    return NextResponse.json(
      { status: "pending", error: "No nonce provided" },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  }

  const { data, error } = await supabase
    .from("tc_auth_requests")
    .select("status, phone, temp_password")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) console.error("[TC-Status] DB error:", error);

  const response = data ?? { status: "pending" };

  return NextResponse.json(response, {
    headers: {
      // Prevent ALL caching — browser, CDN, Next.js
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
    },
  });
}