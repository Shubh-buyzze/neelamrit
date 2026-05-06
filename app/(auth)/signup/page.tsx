"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((mod) => mod.DotLottiePlayer),
  { ssr: false }
);

export default function SignupPage() {
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleTruecallerAuth = () => {
    setLoading(true);
    setSuccessMsg("Opening Truecaller App...");
    const requestNonce = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    const tcLink = `truecallersdk://truesdk/web_verify?requestNonce=${requestNonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&skipOption=faq`;
    window.location.href = tcLink;
  };

  async function handleSignup() {
    if (!form.full_name || !form.phone || !form.email || !form.password) { setError("All fields are required"); return; }
    if (!acceptedTerms) { setError("Please accept the Terms & Conditions."); return; }
    setLoading(true); setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw authError;

      if (authData.user) {
        await supabase.from("users_profile").upsert({
          id: authData.user.id, full_name: form.full_name, phone: form.phone, role: "customer"
        }, { onConflict: "phone" });
      }
      window.location.href = "/login?registered=true";
    } catch (err: any) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col lg:flex-row">
        
        <div className="flex-1 bg-gradient-to-br from-amber-50/50 p-8 lg:p-12 flex flex-col items-center justify-center border-r">
          <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl">
            <DotLottiePlayer src="/login-anim.lottie" autoplay loop />
          </div>
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6">Join the Family</h2>
        </div>

        <div className="flex-1 p-8 sm:p-12 lg:p-14">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
          </div>

          {successMsg && <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-[12px] font-bold">✓ {successMsg}</div>}
          {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-800 text-[12px] font-bold">⚠️ {error}</div>}

          <button onClick={handleTruecallerAuth} disabled={loading} className="w-full md:hidden mb-6 bg-[#0087FF] text-white py-4 rounded-2xl text-[13px] font-black tracking-wide shadow-lg active:scale-95 transition-all">
            1-CLICK SIGNUP WITH TRUECALLER
          </button>

          <div className="md:hidden flex items-center gap-4 mb-6 opacity-30">
            <div className="flex-1 h-px bg-gray-400"></div><span className="text-[10px] font-black uppercase text-gray-600">OR MANUAL</span><div className="flex-1 h-px bg-gray-400"></div>
          </div>

          <div className="space-y-4">
            {/* 🟢 FIXED: text-gray-900 & placeholder-gray-400 added for visibility */}
            <input type="text" placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors" />
            <input type="tel" placeholder="Phone (10-digit)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0,10) })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors" />

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 mt-1" />
              <label className="text-[12px] font-medium text-gray-500">I agree to the Terms & Conditions.</label>
            </div>

            <button onClick={handleSignup} disabled={loading} className="w-full py-5 mt-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-900 text-white shadow-xl hover:bg-black transition-all">
              {loading && !successMsg ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center text-sm font-medium text-gray-500">
            Already have an account? <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}