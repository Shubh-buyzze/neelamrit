"use client";

/**
 * LOGIN PAGE
 * Path: /app/(auth)/login/page.tsx
 *
 * Two login methods:
 * 1. Truecaller 1-tap (mobile only — shown when md breakpoint not hit)
 * 2. Standard email + password
 *
 * Truecaller flow (Flipkart-style):
 * 1. Generate nonce → trigger deep link
 * 2. Poll /api/auth/truecaller/status?nonce=... every 2s
 * 3. On success → signInWithPassword using ghost email + temp_password from DB
 * 4. Redirect to /
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer),
  { ssr: false }
);

// ── Generate a cryptographically strong nonce (8–64 chars, URL-safe) ──────────
function generateNonce(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 12);
  const rand2 = Math.random().toString(36).slice(2, 8);
  return `${rand}${ts}${rand2}`; // ~26 chars, all alphanumeric
}

export default function LoginPage() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [status, setStatus]         = useState<"idle" | "loading" | "polling" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg]   = useState("");
  const [errorMsg, setErrorMsg]     = useState("");
  const [isMobile, setIsMobile]     = useState(false);

  const pollTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const killTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nonceRef      = useRef<string>("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Detect mobile (Truecaller only works on Android/iOS with app installed)
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      if (killTimerRef.current) clearTimeout(killTimerRef.current);
    };
  }, []);

  const stopPolling = () => {
    if (pollTimerRef.current)  { clearInterval(pollTimerRef.current);  pollTimerRef.current  = null; }
    if (killTimerRef.current)  { clearTimeout(killTimerRef.current);   killTimerRef.current  = null; }
  };

  const setError = (msg: string) => {
    stopPolling();
    setStatus("error");
    setErrorMsg(msg);
    setStatusMsg("");
  };

  // ── Truecaller login ────────────────────────────────────────────────────────
  const handleTruecallerLogin = () => {
    setStatus("loading");
    setStatusMsg("Truecaller App खुल रही है...");
    setErrorMsg("");

    const nonce      = generateNonce();
    nonceRef.current = nonce;
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    // IMPORTANT: Use window.open in a new tab so page focus trick works.
    // Truecaller app intercepts the deep link; browser tab stays open.
    const deeplink = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&lang=hi&title=logIn&skipOption=useDifferentNumber`;

    // Trigger deep link
    window.location.href = deeplink;

    // Wait 800ms then start polling (give Truecaller time to open)
    setTimeout(() => {
      setStatus("polling");
      setStatusMsg("Truecaller में Approve करें...");
      startPolling(nonce);
    }, 800);

    // Kill polling after 90 seconds
    killTimerRef.current = setTimeout(() => {
      setError("Request timeout हो गया। दोबारा try करें।");
    }, 90_000);
  };

  const startPolling = (nonce: string) => {
    pollTimerRef.current = setInterval(async () => {
      try {
        // CRITICAL: cache: "no-store" — prevent browser from caching "pending"
        const res = await fetch(`/api/auth/truecaller/status?nonce=${nonce}&_=${Date.now()}`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
        });

        if (!res.ok) return; // network blip — keep polling

        const data = await res.json();
        console.log("[TC-Poll] status:", data.status);

        if (data.status === "success") {
          stopPolling();
          setStatus("success");
          setStatusMsg("Verified! Login हो रहा है...");

          // Sign in using ghost credentials stored by webhook
          const ghostEmail = `${data.phone}@neelamrit.com`;
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: ghostEmail,
            password: data.temp_password,
          });

          if (authErr) {
            setError(`Login Error: ${authErr.message}`);
            return;
          }

          // Success → redirect
          window.location.assign("/");
        }
        // if "pending" → keep polling silently
      } catch (e: any) {
        console.error("[TC-Poll] fetch error:", e.message);
        // Don't kill polling on single network error — might be a blip
      }
    }, 2000); // poll every 2 seconds
  };

  // ── Standard email + password login ────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg("Email और Password दोनों भरें");
      return;
    }
    setStatus("loading");
    setStatusMsg("Verifying...");
    setErrorMsg("");

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setStatus("error");
      setErrorMsg(authErr.message);
      setStatusMsg("");
    } else {
      window.location.assign("/");
    }
  };

  const isLoading  = status === "loading" || status === "polling";
  const isSuccess  = status === "success";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">

        {/* ── Left decorative panel ─────────────────────────────────────────── */}
        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">
            वापस आपका स्वागत है!
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Authentic Neelam & Gemstones
          </p>
        </div>

        {/* ── Right: Login form ─────────────────────────────────────────────── */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">
              NEELAMRIT
            </h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">
              Login to your account
            </p>
          </div>

          {/* Status messages */}
          {statusMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span className="text-lg">{isSuccess ? "✅" : "⏳"}</span>
              {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span className="text-lg">⚠️</span> {errorMsg}
            </div>
          )}

          {/* ── Truecaller button (mobile only — Truecaller needs phone app) ── */}
          {isMobile && (
            <>
              <button
                onClick={handleTruecallerLogin}
                disabled={isLoading || isSuccess}
                className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {/* Truecaller logo */}
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.2" />
                  <path d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 4c1.8 0 3.5.5 5 1.4l-9.6 9.6c-.9-1.5-1.4-3.2-1.4-5 0-4.4 3.6-8 8-8zm0 16c-1.8 0-3.5-.5-5-1.4l9.6-9.6c.9 1.5 1.4 3.2 1.4 5 0 4.4-3.6 8-8 8z" fill="white" />
                </svg>
                {status === "polling"
                  ? "Truecaller में Approve करें..."
                  : status === "loading"
                  ? "खुल रहा है..."
                  : "Truecaller से 1-Click Login"}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  या Email से
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* ── Email + Password form ─────────────────────────────────────── */}
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
              disabled={isLoading || isSuccess}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isLoading || isSuccess}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />

            <button
              onClick={handleEmailLogin}
              disabled={isLoading || isSuccess}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && status === "loading" ? "Verifying..." : "Sign In"}
            </button>
          </div>

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