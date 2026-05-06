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

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") setSuccessMsg("Account created! Please login.");
    if (params.get("error")) setError("Truecaller verification failed. Try again.");
  }, []);

  // 🟢 1. TRUECALLER 1-CLICK LOGIN
  const handleTruecallerLogin = () => {
    setLoading(true);
    setSuccessMsg("Opening Truecaller...");
    const requestNonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    const tcLink = `truecallersdk://truesdk/web_verify?requestNonce=${requestNonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&skipOption=faq`;
    window.location.href = tcLink;
  };

  // 🟢 2. STANDARD LOGIN
  async function handleLogin() {
    if (!email || !password) { setError("Please enter both fields"); return; }
    setLoading(true); setError("");

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); }
    else window.location.href = "/";
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="relative w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            
            <div className="flex-1 bg-gradient-to-br from-amber-50/50 p-12 flex flex-col items-center justify-center border-r">
              <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl">
                <DotLottiePlayer src="/login-anim.lottie" autoplay loop />
              </div>
              <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6">Welcome Back</h2>
            </div>

            <div className="flex-1 p-8 sm:p-12 lg:p-14">
              <div className="text-center mb-10">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
              </div>

              {successMsg && <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-[12px] font-bold animate-pulse">✓ {successMsg}</div>}
              {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-800 text-[12px] font-bold animate-shake">⚠️ {error}</div>}

              <button
                onClick={handleTruecallerLogin}
                disabled={loading}
                className="w-full md:hidden mb-6 bg-[#0087FF] text-white py-4 rounded-2xl text-[13px] font-black tracking-wide shadow-lg active:scale-95 transition-all"
              >
                1-CLICK LOGIN WITH TRUECALLER
              </button>

              <div className="md:hidden flex items-center gap-4 mb-6 opacity-30">
                <div className="flex-1 h-px bg-gray-400"></div><span className="text-[10px] font-black uppercase text-gray-500">OR EMAIL</span><div className="flex-1 h-px bg-gray-400"></div>
              </div>

              <div className="space-y-6">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full px-6 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:border-amber-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="w-full px-6 py-4.5 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-semibold outline-none focus:border-amber-400" />

                <button onClick={handleLogin} disabled={loading} className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-900 text-white shadow-xl hover:bg-black transition-all">
                  {loading && !successMsg ? "Verifying..." : "Sign In to Account"}
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 text-center text-sm font-medium text-gray-500">
                New here? <Link href="/signup" className="text-amber-900 font-black hover:underline ml-1">Create Account</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}