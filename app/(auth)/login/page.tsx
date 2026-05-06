"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((mod) => mod.DotLottiePlayer),
  { ssr: false }
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isPolling, setIsPolling] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") setSuccessMsg("Account created! Please login.");
  }, []);

  const handleTruecallerLogin = () => {
    setLoading(true);
    setIsPolling(true);
    setSuccessMsg("Opening Truecaller App...");
    setError("");

    const requestNonce = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = `truecallersdk://truesdk/web_verify?requestNonce=${requestNonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&skipOption=faq`;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/truecaller/status?nonce=${requestNonce}`, { cache: 'no-store' });
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(pollInterval);
          setSuccessMsg("Verified! Logging you in securely...");
          
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: `${data.phone}@neelamrit.com`,
            password: data.temp_password
          });
          
          // 🟢 THE FIX: Catching Supabase Error here
          if (authErr) {
            setLoading(false);
            setIsPolling(false);
            setSuccessMsg("");
            setError(`Supabase Error: ${authErr.message}`);
            return;
          }

          window.location.assign("/"); 
        }
      } catch (e: any) {
        clearInterval(pollInterval);
        setLoading(false);
        setIsPolling(false);
        setSuccessMsg("");
        setError(`System Error: ${e.message}`);
      }
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      if (isPolling) {
        setLoading(false); setIsPolling(false); setSuccessMsg("");
        setError("Truecaller request timed out. Please try again.");
      }
    }, 60000); 
  };

  async function handleLogin() {
    if (!email || !password) { setError("Please enter both fields"); return; }
    setLoading(true); setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); }
    else window.location.assign("/");
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col lg:flex-row border border-gray-100">
        <div className="flex-1 bg-amber-50/50 p-12 flex flex-col items-center justify-center border-r">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-80 h-80" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6">Welcome Back</h2>
        </div>

        <div className="flex-1 p-8 lg:p-14">
          <div className="text-center mb-10">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
          </div>

          {successMsg && <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold">✓ {successMsg}</div>}
          {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-bold">⚠️ {error}</div>}

          <button onClick={handleTruecallerLogin} disabled={loading} className="w-full md:hidden mb-6 bg-[#0087FF] text-white py-4 rounded-2xl text-[13px] font-black tracking-wide shadow-lg active:scale-95 transition-all">
            {loading && isPolling ? "WAITING FOR APPROVAL..." : "1-CLICK LOGIN WITH TRUECALLER"}
          </button>

          <div className="md:hidden flex items-center gap-4 mb-6 opacity-30">
            <div className="flex-1 h-px bg-gray-400"></div><span className="text-[10px] font-black uppercase text-gray-500">OR EMAIL</span><div className="flex-1 h-px bg-gray-400"></div>
          </div>

          <div className="space-y-6">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-6 py-4.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="w-full px-6 py-4.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />

            <button onClick={handleLogin} disabled={loading} className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-900 text-white shadow-xl hover:bg-black transition-all">
              {loading && !isPolling ? "Verifying..." : "Sign In"}
            </button>
          </div>

          <div className="mt-10 pt-8 border-t text-center text-sm font-medium text-gray-500">
            New here? <Link href="/signup" className="text-amber-900 font-black hover:underline ml-1">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}