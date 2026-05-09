"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(() => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer), { ssr: false });

function generateNonce(): string { return Math.random().toString(36).slice(2, 12) + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "polling" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const killTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => { setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)); }, []);
  useEffect(() => { return () => { stopPolling(); }; }, []);

  const stopPolling = () => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    if (killTimerRef.current) clearTimeout(killTimerRef.current);
  };

  const setError = (msg: string) => { stopPolling(); setStatus("error"); setErrorMsg(msg); setStatusMsg(""); };

  const handleTruecallerSignup = () => {
    setStatus("loading"); setStatusMsg("Truecaller App खुल रही है..."); setErrorMsg("");
    const nonce = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&lang=hi&title=signUp&skipOption=useDifferentNumber`;

    setTimeout(() => {
      setStatus("polling"); setStatusMsg("Truecaller में Approve करें...");
      pollTimerRef.current = setInterval(async () => {
        try {
          // 🟢 FIX: Corrected Path (/api/truecaller/status)
          const res = await fetch(`/api/truecaller/status?nonce=${nonce}&_=${Date.now()}`, { cache: "no-store" });
          if (!res.ok) return;

          const data = await res.json();
          if (data.status === "success") {
            stopPolling(); setStatus("success"); setStatusMsg("Verified! Login हो रहा है...");

            // 🟢 THE FIX: Using real email fetched from status API
            const { error: authErr } = await supabase.auth.signInWithPassword({
              email: data.email,
              password: data.temp_password,
            });

            if (authErr) { setError(`Login Error: ${authErr.message}`); return; }
            window.location.assign("/");
          }
        } catch (e: any) { console.error("[TC-Poll]", e.message); }
      }, 2000);
    }, 800);

    killTimerRef.current = setTimeout(() => { setError("Request timeout। दोबारा try करें।"); }, 90_000);
  };

  const handleManualSignup = async () => {
    if (!form.full_name || !form.phone || !form.email || !form.password) { setErrorMsg("सभी fields भरें"); return; }
    if (form.phone.length !== 10) { setErrorMsg("10 अंकों का phone number डालें"); return; }
    if (!acceptedTerms) { setErrorMsg("Terms & Conditions accept करें"); return; }

    setStatus("loading"); setStatusMsg("Account बन रहा है..."); setErrorMsg("");

    try {
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email, password: form.password, options: { data: { full_name: form.full_name } },
      });
      if (authErr) throw authErr;

      if (authData.user) {
        await supabase.from("users_profile").upsert(
          { id: authData.user.id, full_name: form.full_name, phone: form.phone, role: "customer" },
          { onConflict: "id" } 
        );
      }
      window.location.assign("/login?registered=true");
    } catch (err: any) { setError(err.message); }
  };

  const isLoading = status === "loading" || status === "polling";
  const isSuccess = status === "success";

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl flex flex-col lg:flex-row overflow-hidden border border-gray-100">
        <div className="flex-1 bg-amber-50/60 p-12 hidden lg:flex flex-col items-center justify-center border-r border-amber-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-72 h-72" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6 text-center">परिवार में शामिल हों</h2>
        </div>

        <div className="flex-1 p-8 lg:p-14 flex flex-col justify-center">
          <div className="text-center mb-7">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
            <p className="text-gray-400 text-xs mt-1 font-medium tracking-widest uppercase">Create your account</p>
          </div>

          {statusMsg && <div className="mb-5 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold"> {isSuccess ? "✅" : "⏳"} {statusMsg}</div>}
          {errorMsg && <div className="mb-5 p-4 rounded-2xl bg-red-50 text-red-700 text-xs font-semibold"> ⚠️ {errorMsg}</div>}

          {isMobile && (
            <>
              <button onClick={handleTruecallerSignup} disabled={isLoading || isSuccess} className="w-full mb-5 flex items-center justify-center gap-3 bg-[#0087FF] hover:bg-[#006FD6] active:scale-95 text-white py-4 px-6 rounded-2xl text-sm font-black tracking-wide shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                {status === "polling" ? "Truecaller में Approve करें..." : status === "loading" ? "खुल रहा है..." : "Truecaller से 1-Click Signup"}
              </button>
              <div className="flex items-center gap-3 mb-5"><div className="flex-1 h-px bg-gray-200" /><span className="text-[10px] font-bold uppercase text-gray-400 tracking-widest">या manually</span><div className="flex-1 h-px bg-gray-200" /></div>
            </>
          )}

          <div className="space-y-4">
            <input type="text" placeholder="पूरा नाम (Full Name)" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} disabled={isLoading || isSuccess} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white disabled:opacity-60" />
            <input type="tel" placeholder="Phone Number (10 अंक)" value={form.phone} maxLength={10} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })} disabled={isLoading || isSuccess} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white disabled:opacity-60" />
            <input type="email" placeholder="Email Address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={isLoading || isSuccess} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white disabled:opacity-60" />
            <input type="password" placeholder="Password बनाएं" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} disabled={isLoading || isSuccess} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white disabled:opacity-60" />

            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 mt-0.5 accent-amber-800" />
              <span className="text-xs text-gray-500 font-medium">मैं <Link href="/terms" className="text-amber-800 underline">Terms & Conditions</Link> से सहमत हूँ।</span>
            </label>

            <button onClick={handleManualSignup} disabled={isLoading || isSuccess} className="w-full py-4 mt-1 rounded-2xl text-xs font-black uppercase tracking-widest bg-amber-900 hover:bg-gray-900 text-white shadow-lg disabled:opacity-60">
              {isLoading && status === "loading" ? "Creating Account..." : "Account बनाएं"}
            </button>
          </div>

          <div className="mt-7 pt-5 border-t border-gray-100 text-center text-sm font-medium text-gray-500">
            पहले से account है? <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">Login करें</Link>
          </div>
        </div>
      </div>
    </div>
  );
}