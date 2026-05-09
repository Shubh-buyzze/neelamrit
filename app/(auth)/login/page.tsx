"use client";

/**
 * FILE: src/app/(auth)/login/page.tsx
 *
 * Truecaller flow:
 * 1. Generate nonce → trigger deeplink
 * 2. Poll /api/truecaller/status every 2s
 * 3. On success → signInWithPassword with phone@neelamrit.com + temp_password
 * 4. New user → /complete-profile | Returning user → /
 *
 * Ghost email formula: `${data.phone}@neelamrit.com`
 * This ALWAYS matches what webhook created in Auth. Never use real email here.
 */

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer),
  { ssr: false }
);

function generateNonce(): string {
  return (
    Math.random().toString(36).slice(2, 12) +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 6)
  );
}

export default function LoginPage() {
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [status, setStatus]       = useState<"idle"|"loading"|"polling"|"success"|"error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg]   = useState("");
  const [isMobile, setIsMobile]   = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const killRef = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (killRef.current) { clearTimeout(killRef.current);  killRef.current  = null; }
  };

  const showError = (msg: string) => {
    stopPolling();
    setStatus("error");
    setErrorMsg(msg);
    setStatusMsg("");
  };

  // ── Truecaller ──────────────────────────────────────────────────────────────
  const handleTruecallerLogin = () => {
    setStatus("loading");
    setStatusMsg("Truecaller खुल रही है...");
    setErrorMsg("");

    const nonce      = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&lang=hi&title=logIn&skipOption=useDifferentNumber`;

    setTimeout(() => {
      setStatus("polling");
      setStatusMsg("Truecaller में Approve करें...");

      pollRef.current = setInterval(async () => {
        try {
          // PATH: /api/truecaller/status  (confirmed correct path)
          // _= cache-buster + no-store headers = no cached "pending" ever
          const res = await fetch(
            `/api/truecaller/status?nonce=${nonce}&_=${Date.now()}`,
            { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
          );
          if (!res.ok) return; // network blip — keep polling

          const data = await res.json();
          console.log("[TC-Poll] status:", data.status, "| isNew:", data.is_new_user);

          if (data.status === "success") {
            stopPolling();
            setStatus("success");
            setStatusMsg("Verified! Login हो रहा है...");

            // GHOST EMAIL — always phone@neelamrit.com, same as what webhook used
            // data.phone comes from the DB, guaranteed correct
            const ghostEmail = `${data.phone}@neelamrit.com`;

            const { error: authErr } = await supabase.auth.signInWithPassword({
              email:    ghostEmail,
              password: data.temp_password,
            });

            if (authErr) {
              console.error("[TC-Login] signInWithPassword failed:", authErr.message);
              showError(`Login Error: ${authErr.message}`);
              return;
            }

            // New user → fill profile first | Returning → home
            window.location.assign(data.is_new_user ? "/complete-profile" : "/");
          }
        } catch (e: any) {
          console.error("[TC-Poll] fetch error:", e.message);
          // Don't stop on single blip — might be temporary
        }
      }, 2000);
    }, 800);

    killRef.current = setTimeout(() => {
      showError("Request timeout। दोबारा try करें।");
    }, 90_000);
  };

  // ── Email + Password ────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) { setErrorMsg("Email और Password दोनों भरें"); return; }
    setStatus("loading");
    setStatusMsg("Verifying...");
    setErrorMsg("");

    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password });
    if (authErr) {
      setStatus("error");
      setErrorMsg(authErr.message);
      setStatusMsg("");
      return;
    }

    // Check profile_complete for email login users
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: prof } = await supabase
        .from("users_profile")
        .select("profile_complete, full_name")
        .eq("id", user.id)
        .maybeSingle();
      if (prof?.profile_complete === false && !prof?.full_name) {
        window.location.assign("/complete-profile");
        return;
      }
    }
    window.location.assign("/");
  };

  const isLoading = status === "loading" || status === "polling";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">

        {/* Left panel */}
        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">वापस आपका स्वागत है!</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Authentic Neelam & Gemstones</p>
        </div>

        {/* Right: form */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">Login to your account</p>
          </div>

          {statusMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>{isSuccess ? "✅" : "⏳"}</span> {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {/* Truecaller — mobile only */}
          {isMobile && (
            <>
              <button
                onClick={handleTruecallerLogin} disabled={isLoading || isSuccess}
                className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.25"/>
                  <path d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 4c1.8 0 3.5.5 5 1.4l-9.6 9.6c-.9-1.5-1.4-3.2-1.4-5 0-4.4 3.6-8 8-8zm0 16c-1.8 0-3.5-.5-5-1.4l9.6-9.6c.9 1.5 1.4 3.2 1.4 5 0 4.4-3.6 8-8 8z" fill="white"/>
                </svg>
                {status === "polling" ? "Approve करें Truecaller में..." : status === "loading" ? "खुल रहा है..." : "1-Click Login with Truecaller"}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200"/>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">या Email से</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>
            </>
          )}

          {/* Email + Password */}
          <div className="space-y-4">
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address" disabled={isLoading || isSuccess}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" disabled={isLoading || isSuccess}
              onKeyDown={(e) => e.key === "Enter" && handleEmailLogin()}
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <button
              onClick={handleEmailLogin} disabled={isLoading || isSuccess}
              className="w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && status === "loading" ? "Verifying..." : "Sign In"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
            New here?{" "}
            <Link href="/signup" className="text-amber-900 font-black hover:underline ml-1">Account बनाएं</Link>
          </div>
        </div>
      </div>
    </div>
  );
}