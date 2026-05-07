import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function handleTruecallerCallback(
  accessToken: string,
  requestNonce: string
) {
  // 1. Fetch profile from Truecaller
  const tcRes = await fetch("https://profile4.truecaller.com/v1/default", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!tcRes.ok) {
    throw new Error("Truecaller token expired or invalid");
  }
  const profile = await tcRes.json();

  const rawPhone = profile.phoneNumbers?.[0] || profile.phoneNumber || "";
  const phone = String(rawPhone).replace("+91", "").trim();
  const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
  const ghostEmail = `${phone}@neelamrit.com`;
  const tempPassword = "Tc_" + Math.random().toString(36).slice(-10) + "Z9!";

  let userId: string;

  // 2. Check if user already exists by phone in users_profile
  const { data: existingProfile } = await supabaseAdmin
    .from("users_profile")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (existingProfile?.id) {
    // User exists → update password in Auth
    userId = existingProfile.id;
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: tempPassword }
    );
    if (updateError) throw updateError;
  } else {
    // 3. User does not exist → create new Auth user
    const { data: newUser, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: ghostEmail,
        password: tempPassword,
        email_confirm: true,
      });
    if (createError) {
      // Fallback: maybe the user exists in Auth but not in users_profile
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const fallbackUser = userList.users.find((u) => u.email === ghostEmail);
      if (fallbackUser) {
        userId = fallbackUser.id;
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: tempPassword,
        });
      } else {
        throw createError;
      }
    } else {
      userId = newUser.user.id;
    }
  }

  // 4. Upsert users_profile – always include the primary key `id`
  const { error: profileError } = await supabaseAdmin
    .from("users_profile")
    .upsert({
      id: userId,
      phone: phone,
      full_name: fullName,
      role: "customer",
    });
  if (profileError) throw profileError;

  // 5. Store / update the status for the frontend polling
  const { error: statusError } = await supabaseAdmin
    .from("tc_auth_requests")
    .upsert({
      nonce: requestNonce,
      phone: phone,
      temp_password: tempPassword,
      status: "success",
    });
  if (statusError) throw statusError;

  return { success: true };
}

// ------------------------------------------------------------
// GET  – tokens arrive as query parameters
// POST – tokens arrive as application/x-www-form-urlencoded
// ------------------------------------------------------------
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const accessToken = url.searchParams.get("accessToken") || url.searchParams.get("token");
    const requestNonce = url.searchParams.get("requestNonce") || url.searchParams.get("requestId");

    if (!accessToken || !requestNonce) {
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestNonce in query" },
        { status: 400 }
      );
    }

    await handleTruecallerCallback(accessToken, requestNonce);
    // Redirect the user back to your app after successful processing
    return NextResponse.redirect(new URL("/login?truecaller=success", req.url));
  } catch (err: any) {
    console.error("Truecaller GET callback error:", err.message);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(err.message)}`, req.url)
    );
  }
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const params = new URLSearchParams(bodyText);
    const accessToken = params.get("accessToken") || params.get("token");
    const requestNonce = params.get("requestNonce") || params.get("requestId");

    if (!accessToken || !requestNonce) {
      return NextResponse.json(
        { success: false, error: "Missing accessToken or requestNonce in body" },
        { status: 400 }
      );
    }

    await handleTruecallerCallback(accessToken, requestNonce);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Truecaller POST callback error:", err.message);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}