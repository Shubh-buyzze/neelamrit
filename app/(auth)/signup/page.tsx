"use client";

/**
 * FILE: src/app/(auth)/signup/page.tsx
 * PATH FIX: Status API = /api/truecaller/status
 * GHOST EMAIL FIX: Always phone@neelamrit.com for signInWithPassword
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

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
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

  const handleTruecallerSignup = () => {
    setStatus("loading");
    setStatusMsg("Truecaller खुल रही है...");
    setErrorMsg("");

    const nonce      = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&lang=hi&title=signUp&skipOption=useDifferentNumber`;

    setTimeout(() => {
      setStatus("polling");
      setStatusMsg("Truecaller में Approve करें...");

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/truecaller/status?nonce=${nonce}&_=${Date.now()}`,
            { cache: "no-store", headers: { "Cache-Control": "no-cache", Pragma: "no-cache" } }
          );
          if (!res.ok) return;

          const data = await res.json();
          if (data.status === "success") {
            stopPolling();
            setStatus("success");
            setStatusMsg("Verified! Login हो रहा है...");

            const ghostEmail = `${data.phone}@neelamrit.com`;
            const { error: authErr } = await supabase.auth.signInWithPassword({
              email:    ghostEmail,
              password: data.temp_password,
            });

            if (authErr) { showError(`Login Error: ${authErr.message}`); return; }
            // Truecaller signups always go to complete-profile
            window.location.assign("/complete-profile");
          }
        } catch (e: any) {
          console.error("[TC-Poll]", e.message);
        }
      }, 2000);
    }, 800);

    killRef.current = setTimeout(() => {
      showError("Request timeout। दोबारा try करें।");
    }, 90_000);
  };

  const handleManualSignup = async () => {
    if (!form.full_name || !form.phone || !form.email || !form.password) {
      setErrorMsg("सभी fields भरना जरूरी है"); return;
    }
    if (form.phone.length !== 10) { setErrorMsg("10 अंकों का phone number डालें"); return; }
    if (!acceptedTerms) { setErrorMsg("Terms & Conditions accept करें"); return; }

    setStatus("loading");
    setStatusMsg("Account बन रहा है...");
    setErrorMsg("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (authErr) throw authErr;

      if (authData.user) {
        await supabase.from("users_profile").upsert(
          {
            id: authData.user.id, full_name: form.full_name, phone: form.phone,
            email: form.email, role: "customer", profile_complete: true,
          },
          { onConflict: "id" }
        );
      }
      window.location.assign("/login?registered=true");
    } catch (err: any) { showError(err.message); }
  };

  const isLoading = status === "loading" || status === "polling";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl flex flex-col lg:flex-row overflow-hidden border border-gray-100">

        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">परिवार में शामिल हों</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">Authentic Neelam & Gemstones</p>
        </div>

        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          <div className="text-center mb-7">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">Create your account</p>
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

          {isMobile && (
            <>
              <button
                onClick={handleTruecallerSignup} disabled={isLoading || isSuccess}
                className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <svg width="20" height="20" viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="20" fill="white" fillOpacity="0.25"/>
                  <path d="M20 8C13.4 8 8 13.4 8 20s5.4 12 12 12 12-5.4 12-12S26.6 8 20 8zm0 4c1.8 0 3.5.5 5 1.4l-9.6 9.6c-.9-1.5-1.4-3.2-1.4-5 0-4.4 3.6-8 8-8zm0 16c-1.8 0-3.5-.5-5-1.4l9.6-9.6c.9 1.5 1.4 3.2 1.4 5 0 4.4-3.6 8-8 8z" fill="white"/>
                </svg>
                {status === "polling" ? "Approve करें Truecaller में..." : status === "loading" ? "खुल रहा है..." : "1-Click Signup with Truecaller"}
              </button>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-gray-200"/>
                <span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">या manually</span>
                <div className="flex-1 h-px bg-gray-200"/>
              </div>
            </>
          )}

          <div className="space-y-4">
            {[
              { key: "full_name", type: "text",     ph: "पूरा नाम (Full Name)" },
              { key: "phone",     type: "tel",      ph: "Phone Number (10 अंक)" },
              { key: "email",     type: "email",    ph: "Email Address" },
              { key: "password",  type: "password", ph: "Password बनाएं" },
            ].map(({ key, type, ph }) => (
              <input
                key={key} type={type} placeholder={ph} disabled={isLoading || isSuccess}
                value={form[key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [key]: key === "phone" ? e.target.value.replace(/\D/g,"").slice(0,10) : e.target.value })}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
              />
            ))}

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 mt-0.5 accent-amber-800"/>
              <span className="text-xs text-gray-500 font-medium">
                मैं <Link href="/terms" className="text-amber-800 underline">Terms & Conditions</Link> से सहमत हूँ।
              </span>
            </label>

            <button
              onClick={handleManualSignup} disabled={isLoading || isSuccess}
              className="w-full py-4 mt-1 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading && status === "loading" ? "Creating Account..." : "Account बनाएं"}
            </button>
          </div>

          <div className="mt-7 pt-5 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
            पहले से account है?{" "}
            <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">Login करें</Link>
          </div>
        </div>
      </div>
    </div>
  );
}