"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/(auth)/login/page.tsx                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Login methods:
 *   A) Truecaller 1-tap  (mobile — Truecaller app installed hona chahiye)
 *   B) Email + Password  (manual — sab devices pe)
 *
 * Truecaller flow:
 *   1. Nonce generate karo
 *   2. Deep link trigger karo (Truecaller app open hoti hai)
 *   3. Poll /api/truecaller/status?nonce=... har 2s
 *   4. Success milne pe ghost email se signInWithPassword
 *   5. New user → /complete-profile | Returning → /
 *
 * Ghost email formula: `${data.phone}@neelamrit.com`
 * Webhook bhi same formula use karta hai → hamesha match karega.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer),
  { ssr: false }
);

// Cryptographically-safe enough nonce for this use case
function generateNonce(): string {
  const a = Math.random().toString(36).slice(2, 12);
  const b = Date.now().toString(36);
  const c = Math.random().toString(36).slice(2, 8);
  return `${a}${b}${c}`; // ~26 chars, alphanumeric
}

export default function LoginPage() {
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [tcStatus,  setTcStatus]  = useState<"idle"|"loading"|"polling"|"success"|"error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg,  setErrorMsg]  = useState("");
  const [isMobile,  setIsMobile]  = useState(false);

  // Refs to avoid stale closure issues in setInterval
  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const killRef    = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Detect mobile once on mount (Truecaller only works on mobile)
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    // Cleanup timers on unmount
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

  // ══════════════════════════════════════════════════════════════════════════
  // TRUECALLER LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  function handleTruecallerLogin() {
    setTcStatus("loading");
    setStatusMsg("Truecaller App खुल रही है...");
    setErrorMsg("");

    const nonce      = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    // Trigger Truecaller deep link — app opens on user's phone
    window.location.href = [
      "truecallersdk://truesdk/web_verify",
      `?requestNonce=${nonce}`,
      `&partnerKey=${partnerKey}`,
      `&partnerName=Neelamrit`,
      `&lang=hi`,
      `&title=logIn`,
      `&skipOption=useDifferentNumber`,
    ].join("");

    // Start polling after 800ms (give Truecaller time to intercept the URL)
    const pollDelay = setTimeout(() => {
      setTcStatus("polling");
      setStatusMsg("Truecaller में Approve करें...");

      pollRef.current = setInterval(async () => {
        try {
          // Two layers of cache-busting:
          // 1. `_=` timestamp query param (for aggressive CDNs)
          // 2. cache: "no-store" + headers (for browser and Next.js)
          const res = await fetch(
            `/api/truecaller/status?nonce=${encodeURIComponent(nonce)}&_=${Date.now()}`,
            {
              cache: "no-store",
              headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
          );

          // Non-2xx = network blip, keep polling
          if (!res.ok) {
            console.warn("[TC-Poll] Non-OK response:", res.status);
            return;
          }

          const data = await res.json();
          console.log("[TC-Poll] status:", data.status, "| isNew:", data.is_new_user);

          if (data.status !== "success") return; // still pending

          // ── SUCCESS ────────────────────────────────────────────────────────
          stopPolling();
          setTcStatus("success");
          setStatusMsg("Verified! Login हो रहा है...");

          // Ghost email — same formula as webhook, always matches
          const ghostEmail = `${data.phone}@neelamrit.com`;

          const { error: authErr } = await supabase.auth.signInWithPassword({
            email:    ghostEmail,
            password: data.temp_password,
          });

          if (authErr) {
            console.error("[TC-Login] signInWithPassword error:", authErr.message);
            showError("Login नहीं हो सका। दोबारा try करें।");
            return;
          }

          // New user → complete profile first, else go home
          window.location.assign(data.is_new_user ? "/complete-profile" : "/");

        } catch (fetchErr: unknown) {
          // Single network error → don't stop polling (temporary blip)
          console.warn("[TC-Poll] Fetch error (will retry):", fetchErr);
        }
      }, 2000); // poll every 2 seconds
    }, 800);

    // Kill polling after 90 seconds (user took too long or dismissed Truecaller)
    killRef.current = setTimeout(() => {
      clearTimeout(pollDelay);
      showError("Request timeout हो गया। दोबारा try करें।");
    }, 90_000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // EMAIL + PASSWORD LOGIN
  // ══════════════════════════════════════════════════════════════════════════
  async function handleEmailLogin() {
    if (!email.trim())    { setErrorMsg("Email डालें"); return; }
    if (!password.trim()) { setErrorMsg("Password डालें"); return; }

    setTcStatus("loading");
    setStatusMsg("Verifying...");
    setErrorMsg("");

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password: password.trim(),
    });

    if (authErr) {
      setTcStatus("error");
      setErrorMsg(
        authErr.message === "Invalid login credentials"
          ? "Email या Password गलत है।"
          : authErr.message
      );
      setStatusMsg("");
      return;
    }

    // Check if this email-login user needs to complete profile
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from("users_profile")
        .select("profile_complete, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (prof && prof.profile_complete === false && !prof.full_name) {
        window.location.assign("/complete-profile");
        return;
      }
    }

    window.location.assign("/");
  }

  const isLoading = tcStatus === "loading" || tcStatus === "polling";
  const isSuccess = tcStatus === "success";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">

        {/* ── Left decorative panel (desktop only) ──────────────────────────── */}
        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">
            वापस आपका स्वागत है!
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Authentic Neelam &amp; Gemstones</p>
        </div>

        {/* ── Right: login form ──────────────────────────────────────────────── */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">

          {/* Brand */}
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">
              Login to your account
            </p>
          </div>

          {/* Status / Error banners */}
          {statusMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">{isSuccess ? "✅" : "⏳"}</span>
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">⚠️</span>
              {errorMsg}
              {tcStatus === "error" && (
                <button
                  onClick={() => { setTcStatus("idle"); setErrorMsg(""); setStatusMsg(""); }}
                  className="ml-auto text-red-400 hover:text-red-600 font-black text-xs underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* ── Truecaller button — only on mobile ──────────────────────────── */}
          {isMobile && (
            <>
              <button
                onClick={handleTruecallerLogin}
                disabled={isLoading || isSuccess}
                className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {/* Truecaller icon */}
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.2" />
                  <path
                    d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 4c1.8 0 3.5.5 5 1.4l-9.6 9.6c-.9-1.5-1.4-3.2-1.4-5 0-4.4 3.6-8 8-8zm0 16c-1.8 0-3.5-.5-5-1.4l9.6-9.6c.9 1.5 1.4 3.2 1.4 5 0 4.4-3.6 8-8 8z"
                    fill="white"
                  />
                </svg>
                {tcStatus === "polling"
                  ? "Truecaller में Approve करें..."
                  : tcStatus === "loading"
                  ? "खुल रहा है..."
                  : "1-Click Login with Truecaller"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  या Email से
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* ── Email + Password ─────────────────────────────────────────────── */}
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              disabled={isLoading || isSuccess}
              autoComplete="email"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading || isSuccess}
              autoComplete="current-password"
              onKeyDown={(e) => { if (e.key === "Enter") handleEmailLogin(); }}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <button
              onClick={handleEmailLogin}
              disabled={isLoading || isSuccess}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && tcStatus === "loading" ? "Verifying..." : "Sign In"}
            </button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
            New here?{" "}
            <Link href="/signup" className="text-amber-900 font-black hover:underline ml-1">
              Account बनाएं
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}