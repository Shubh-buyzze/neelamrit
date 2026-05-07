import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// FIX (Problem 4): force-dynamic + revalidate = 0 together tell Next.js to
// NEVER cache this route.  Without these, Next.js served the first "pending"
// response from its cache on every subsequent poll, so the frontend was
// permanently stuck even after the webhook wrote "success" to the DB.
export const dynamic   = "force-dynamic";
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

  // Return a no-cache response so browsers / CDNs also skip caching
  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma:          "no-cache",
    },
  });
}