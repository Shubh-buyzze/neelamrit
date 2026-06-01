"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/(auth)/signup/page.tsx                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Signup methods:
 * A) Truecaller 1-tap  (mobile)  → /complete-profile (naam confirm)
 * B) Manual form       (all)     → /login?registered=true
 *
 * Ghost email rule same as login:
 * signInWithPassword uses `${data.phone}@neelamrit.com` always.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = 'force-dynamic'

const DotLottiePlayer = nextDynamic(
  () => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer),
  { ssr: false }
);

function generateNonce(): string {
  return (
    Math.random().toString(36).slice(2, 12) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

type ManualForm = { full_name: string; phone: string; email: string; password: string };

export default function SignupPage() {
  const [form, setForm]           = useState<ManualForm>({ full_name: "", phone: "", email: "", password: "" });
  const [acceptedTerms, setTerms] = useState(false);
  const [tcStatus,  setTcStatus]  = useState<"idle"|"loading"|"polling"|"success"|"error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [isMobile,  setIsMobile]  = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const killRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const supabase = createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key")
  );

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    return () => stopPolling();
  }, []);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (killRef.current) { clearTimeout(killRef.current);  killRef.current  = null; }
  }

  function showError(msg: string) {
    stopPolling();
    setTcStatus("error");
    setErrorMsg(msg);
    setStatusMsg("");
  }

  function setField(key: keyof ManualForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TRUECALLER SIGNUP
  // ══════════════════════════════════════════════════════════════════════════
  function handleTruecallerSignup() {
    setTcStatus("loading");
    setStatusMsg("Opening Truecaller...");
    setErrorMsg("");

    const nonce      = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = [
      "truecallersdk://truesdk/web_verify",
      `?requestNonce=${nonce}`,
      `&partnerKey=${partnerKey}`,
      `&partnerName=Neelamrit`,
      `&lang=en`,
      `&title=signUp`,
      `&skipOption=useDifferentNumber`,
    ].join("");

    const pollDelay = setTimeout(() => {
      setTcStatus("polling");
      setStatusMsg("Awaiting approval in Truecaller...");

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/truecaller/status?nonce=${encodeURIComponent(nonce)}&_=${Date.now()}`,
            { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
          );

          if (!res.ok) return;

          const data = await res.json();
          console.log("[TC-Poll/signup] status:", data.status);

          if (data.status !== "success") return;

          stopPolling();
          setTcStatus("success");
          setStatusMsg("Verification successful. Logging in...");

          // Ghost email — same formula as webhook
          const ghostEmail = `${data.phone}@neelamrit.com`;

          const { error: authErr } = await supabase.auth.signInWithPassword({
            email:    ghostEmail,
            password: data.temp_password,
          });

          if (authErr) {
            console.error("[TC-Signup] signInWithPassword error:", authErr.message);
            showError("Authentication failed. Please try again.");
            return;
          }

          // Always redirect new Truecaller users to complete-profile
          window.location.assign("/complete-profile");

        } catch (e: unknown) {
          console.warn("[TC-Poll/signup] Fetch error (will retry):", e);
        }
      }, 2000);
    }, 800);

    killRef.current = setTimeout(() => {
      clearTimeout(pollDelay);
      showError("Request timed out. Please try again.");
    }, 90_000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MANUAL SIGNUP
  // ══════════════════════════════════════════════════════════════════════════
  async function handleManualSignup() {
    // Validate
    if (!form.full_name.trim()) { setErrorMsg("Please enter your full name."); return; }
    if (!form.phone.trim() || form.phone.length !== 10) { setErrorMsg("Please enter a valid 10-digit phone number."); return; }
    if (!form.email.trim() || !form.email.includes("@")) { setErrorMsg("Please enter a valid email address."); return; }
    if (!form.password.trim()) { setErrorMsg("Please enter a password."); return; }
    if (form.password.length < 6) { setErrorMsg("Password must be at least 6 characters."); return; }
    if (!acceptedTerms)        { setErrorMsg("Please accept the Terms & Conditions."); return; }

    setTcStatus("loading");
    setStatusMsg("Creating account...");
    setErrorMsg("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.password.trim(),
        options: { data: { full_name: form.full_name.trim() } },
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Failed to create account. Please try again.");

      // Upsert profile — conflict on `id` (PK), not phone
      const { error: profErr } = await supabase.from("users_profile").upsert(
        {
          id:               authData.user.id,
          full_name:        form.full_name.trim(),
          phone:            form.phone.trim(),
          email:            form.email.trim(),
          role:             "customer",
          profile_complete: true,
          created_at:       new Date().toISOString(),
          updated_at:       new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profErr) {
        console.error("[Signup] Profile upsert error:", profErr);
        // Non-fatal — user can still login and fix profile later
      }

      window.location.assign("/login?registered=true");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showError(msg);
    }
  }

  const isLoading = tcStatus === "loading" || tcStatus === "polling";
  const isSuccess = tcStatus === "success";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">

        {/* ── Left decorative panel (Desktop) ────────────────────────────── */}
        <div className="flex-1 bg-gray-50 p-12 hidden md:flex flex-col items-center justify-center border-r border-gray-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-64 h-64" />
          <h2 className="font-serif text-2xl font-medium text-gray-900 mt-6 tracking-tight text-center">
            Join the Family
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center tracking-wide">
            Authentic Neelam & Gemstones
          </p>
        </div>

        {/* ── Right: Signup Form ──────────────────────────────────────────── */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-gray-900 tracking-tight">
              NEELAMRIT
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Create your account
            </p>
          </div>

          {/* Status & Error Messages */}
          {statusMsg && (
            <div className="mb-6 flex items-center gap-3 text-sm font-medium text-gray-700 animate-in fade-in duration-300">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex justify-between items-center animate-in fade-in">
              <span>{errorMsg}</span>
              {tcStatus === "error" && (
                <button
                  onClick={() => { setTcStatus("idle"); setErrorMsg(""); setStatusMsg(""); }}
                  className="text-red-500 hover:text-red-700 underline text-xs ml-4"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {/* ── Truecaller Button (Mobile Only) ──────────────────────────── */}
          {isMobile && (
            <div className="mb-6 animate-in fade-in">
              <button
                onClick={handleTruecallerSignup}
                disabled={isLoading || isSuccess}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {/* 1. Truecaller Logo (WEBP) */}
                <img 
                  src="/truecaller-logo.webp" 
                  alt="Truecaller Icon" 
                  className="w-5 h-5 object-contain" 
                />
                
                {/* 2. Normal Text */}
                <span>1-click Signup with</span>
                
                {/* 3. Truecaller Text (Name Image) */}
                <img 
                  src="/truecaller-text.webp" 
                  alt="Truecaller" 
                  className="h-4 object-contain mt-0.5" 
                />
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-widest">
                  Or register manually
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {/* ── Manual Signup Form ────────────────────────────────────────── */}
          <div className="space-y-4 animate-in fade-in duration-300">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                disabled={isLoading || isSuccess}
                autoComplete="name"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                placeholder="10-digit mobile number"
                value={form.phone}
                maxLength={10}
                onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={isLoading || isSuccess}
                autoComplete="tel"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@example.com"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                disabled={isLoading || isSuccess}
                autoComplete="email"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password (min 6 characters)"
                value={form.password}
                onChange={(e) => setField("password", e.target.value)}
                disabled={isLoading || isSuccess}
                autoComplete="new-password"
                className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 border-gray-300 rounded text-gray-900 focus:ring-gray-900 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-medium leading-relaxed">
                I agree to the{" "}
                <Link href="/terms" className="text-gray-900 underline hover:text-gray-600 transition-colors">
                  Terms &amp; Conditions
                </Link>
                .
              </span>
            </label>

            <button
              onClick={handleManualSignup}
              disabled={isLoading || isSuccess}
              className="w-full mt-4 py-3 flex justify-center items-center gap-2 rounded-md text-sm font-medium bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
            >
              {isLoading && tcStatus === "loading" ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-medium hover:underline ml-1">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}