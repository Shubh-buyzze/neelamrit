"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/(auth)/signup/page.tsx                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Signup methods:
 *   A) Truecaller 1-tap  (mobile)  → /complete-profile (naam confirm)
 *   B) Manual form       (all)     → /login?registered=true
 *
 * Ghost email rule same as login:
 *   signInWithPassword uses `${data.phone}@neelamrit.com` always.
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
    setStatusMsg("Truecaller App खुल रही है...");
    setErrorMsg("");

    const nonce      = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = [
      "truecallersdk://truesdk/web_verify",
      `?requestNonce=${nonce}`,
      `&partnerKey=${partnerKey}`,
      `&partnerName=Neelamrit`,
      `&lang=hi`,
      `&title=signUp`,
      `&skipOption=useDifferentNumber`,
    ].join("");

    const pollDelay = setTimeout(() => {
      setTcStatus("polling");
      setStatusMsg("Truecaller में Approve करें...");

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
          setStatusMsg("Verified! Login हो रहा है...");

          // Ghost email — same formula as webhook
          const ghostEmail = `${data.phone}@neelamrit.com`;

          const { error: authErr } = await supabase.auth.signInWithPassword({
            email:    ghostEmail,
            password: data.temp_password,
          });

          if (authErr) {
            console.error("[TC-Signup] signInWithPassword error:", authErr.message);
            showError("Login नहीं हो सका। दोबारा try करें।");
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
      showError("Request timeout। दोबारा try करें।");
    }, 90_000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MANUAL SIGNUP
  // ══════════════════════════════════════════════════════════════════════════
  async function handleManualSignup() {
    // Validate
    if (!form.full_name.trim()) { setErrorMsg("पूरा नाम डालें"); return; }
    if (!form.phone.trim() || form.phone.length !== 10) { setErrorMsg("10 अंकों का phone number डालें"); return; }
    if (!form.email.trim())    { setErrorMsg("Email डालें"); return; }
    if (!form.password.trim()) { setErrorMsg("Password डालें"); return; }
    if (form.password.length < 6) { setErrorMsg("Password कम से कम 6 characters का होना चाहिए"); return; }
    if (!acceptedTerms)        { setErrorMsg("Terms & Conditions accept करें"); return; }

    setTcStatus("loading");
    setStatusMsg("Account बन रहा है...");
    setErrorMsg("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email:    form.email.trim(),
        password: form.password.trim(),
        options: { data: { full_name: form.full_name.trim() } },
      });

      if (authErr) throw authErr;
      if (!authData.user) throw new Error("Account create नहीं हो सका। दोबारा try करें।");

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
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl flex flex-col lg:flex-row overflow-hidden border border-gray-100">

        {/* Left decorative panel */}
        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">
            परिवार में शामिल हों
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Authentic Neelam &amp; Gemstones</p>
        </div>

        {/* Right: form */}
        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">

          <div className="text-center mb-7">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">
              Create your account
            </p>
          </div>

          {/* Banners */}
          {statusMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <span>{isSuccess ? "✅" : "⏳"}</span> {statusMsg}
            </div>
          )}
          {errorMsg && (
            <div className="mb-5 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>⚠️</span> {errorMsg}
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

          {/* Truecaller — mobile only */}
          {isMobile && (
            <>
              <button
                onClick={handleTruecallerSignup}
                disabled={isLoading || isSuccess}
                className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.2" />
                  <path
                    d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 4c1.8 0 3.5.5 5 1.4l-9.6 9.6c-.9-1.5-1.4-3.2-1.4-5 0-4.4 3.6-8 8-8zm0 16c-1.8 0-3.5-.5-5-1.4l9.6-9.6c.9 1.5 1.4 3.2 1.4 5 0 4.4-3.6 8-8 8z"
                    fill="white"
                  />
                </svg>
                {tcStatus === "polling"
                  ? "Approve करें Truecaller में..."
                  : tcStatus === "loading"
                  ? "खुल रहा है..."
                  : "1-Click Signup with Truecaller"}
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">
                  या manually
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </>
          )}

          {/* Manual form */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="पूरा नाम (Full Name)"
              value={form.full_name}
              onChange={(e) => setField("full_name", e.target.value)}
              disabled={isLoading || isSuccess}
              autoComplete="name"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="tel"
              placeholder="Phone Number (10 अंक)"
              value={form.phone}
              maxLength={10}
              onChange={(e) => setField("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              disabled={isLoading || isSuccess}
              autoComplete="tel"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              disabled={isLoading || isSuccess}
              autoComplete="email"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />
            <input
              type="password"
              placeholder="Password बनाएं (min 6 characters)"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              disabled={isLoading || isSuccess}
              autoComplete="new-password"
              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
            />

            <label className="flex items-start gap-3 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setTerms(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-amber-800 cursor-pointer"
              />
              <span className="text-xs text-gray-500 font-medium leading-relaxed">
                मैं{" "}
                <Link href="/terms" className="text-amber-800 underline hover:text-amber-600">
                  Terms &amp; Conditions
                </Link>{" "}
                से सहमत हूँ।
              </span>
            </label>

            <button
              onClick={handleManualSignup}
              disabled={isLoading || isSuccess}
              className="w-full py-4 mt-1 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && tcStatus === "loading" ? "Creating Account..." : "Account बनाएं"}
            </button>
          </div>

          <div className="mt-7 pt-5 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
            पहले से account है?{" "}
            <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">
              Login करें
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}