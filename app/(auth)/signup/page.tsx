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
  const [isPolling, setIsPolling] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleTruecallerAuth = () => {
    setLoading(true);
    setIsPolling(true);
    setSuccessMsg("Opening Truecaller App...");
    setError("");

    const requestNonce = Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = `truecallersdk://truesdk/web_verify?requestNonce=${requestNonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&skipOption=faq`;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(`/api/truecaller/status?nonce=${requestNonce}`, { cache: 'no-store' });
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(pollInterval);
          setSuccessMsg("Account Verified! Logging in securely...");
          
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: `${data.phone}@neelamrit.com`,
            password: data.temp_password
          });
          
          if (authErr) {
            setLoading(false); setIsPolling(false); setSuccessMsg("");
            setError(`Login Error: ${authErr.message}`);
            return;
          }
          window.location.assign("/"); 
        }
      } catch (e: any) {
        clearInterval(pollInterval);
        setLoading(false); setIsPolling(false); setSuccessMsg("");
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

  async function handleManualSignup() {
    if (!form.full_name || !form.phone || !form.email || !form.password) { setError("All fields required"); return; }
    if (!acceptedTerms) { setError("Accept Terms & Conditions."); return; }
    setLoading(true); setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: form.email, password: form.password });
      if (authError) throw authError;

      if (authData.user) {
        await supabase.from("users_profile").upsert({
          id: authData.user.id, full_name: form.full_name, phone: form.phone, role: "customer"
        }, { onConflict: "phone" });
      }
      window.location.assign("/login?registered=true");
    } catch (err: any) {
      setError(err.message); setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 font-sans">
      <div className="relative w-full max-w-5xl mx-auto bg-white rounded-[2.5rem] shadow-xl flex flex-col lg:flex-row overflow-hidden border border-gray-100">
        <div className="flex-1 bg-amber-50/50 p-12 flex flex-col items-center justify-center border-r">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-80 h-80" />
          <h2 className="font-serif text-3xl font-bold text-gray-800 mt-6">Join the Family</h2>
        </div>

        <div className="flex-1 p-8 lg:p-14">
          <div className="text-center mb-8">
            <h1 className="font-serif text-4xl font-black text-gray-900 tracking-tighter">NEELAMRIT</h1>
          </div>

          {successMsg && <div className="mb-6 p-4 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-bold">✓ {successMsg}</div>}
          {error && <div className="mb-6 p-4 rounded-2xl bg-red-50 text-red-800 text-xs font-bold">⚠️ {error}</div>}

          <button onClick={handleTruecallerAuth} disabled={loading} className="w-full md:hidden mb-6 bg-[#0087FF] text-white py-4 rounded-2xl text-[13px] font-black tracking-wide shadow-lg active:scale-95 transition-all">
            {loading && isPolling ? "WAITING FOR APPROVAL..." : "1-CLICK SIGNUP WITH TRUECALLER"}
          </button>

          <div className="md:hidden flex items-center gap-4 mb-6 opacity-30">
            <div className="flex-1 h-px bg-gray-400"></div><span className="text-[10px] font-black uppercase text-gray-600">OR MANUAL</span><div className="flex-1 h-px bg-gray-400"></div>
          </div>

          <div className="space-y-4">
            <input type="text" placeholder="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />
            <input type="tel" placeholder="Phone (10-digit)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0,10) })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white" />

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} className="w-4 h-4 mt-1" />
              <label className="text-xs font-medium text-gray-500">I agree to the Terms & Conditions.</label>
            </div>

            <button onClick={handleManualSignup} disabled={loading} className="w-full py-5 mt-2 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-amber-900 text-white shadow-xl hover:bg-black transition-all">
              {loading && !isPolling ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm font-medium text-gray-500">
            Already have an account? <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}