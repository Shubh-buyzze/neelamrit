"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

// Dynamic import for Lottie player (SSR disabled)
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

  // useRef to avoid stale closure in setTimeout
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // ✅ FIX: Page load par check karo koi pending TC nonce hai sessionStorage mein
  useEffect(() => {
    const savedNonce = sessionStorage.getItem("tc_nonce");
    const isPollingActive = sessionStorage.getItem("tc_polling");

    if (savedNonce && isPollingActive === "true") {
      setLoading(true);
      setIsPolling(true);
      setSuccessMsg("Check your Truecaller App and Approve...");
      startPolling(savedNonce);
    }

    return () => {
      // Cleanup on unmount
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, []);

  const startPolling = (nonce: string) => {
    // Clear any existing intervals
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/truecaller/status?nonce=${nonce}`);
        const data = await res.json();

        if (data.status === "success") {
          clearInterval(pollIntervalRef.current!);
          clearTimeout(pollTimeoutRef.current!);
          sessionStorage.removeItem("tc_nonce");
          sessionStorage.removeItem("tc_polling");

          setSuccessMsg("Account Created! Logging you in...");

          await supabase.auth.signInWithPassword({
            email: `${data.phone}@neelamrit.com`,
            password: data.temp_password,
          });

          window.location.href = "/";
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2500);

    // Stop polling after 90 seconds
    pollTimeoutRef.current = setTimeout(() => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      sessionStorage.removeItem("tc_nonce");
      sessionStorage.removeItem("tc_polling");
      setLoading(false);
      setIsPolling(false);
      setSuccessMsg("");
      setError("Truecaller request timed out. Please try manual signup.");
    }, 90000);
  };

  // ✅ FIX: Nonce sessionStorage mein save karo BEFORE redirect
  const handleTruecallerAuth = async () => {
    setError("");
    setLoading(true);
    setIsPolling(true);
    setSuccessMsg("Check your Truecaller App and Approve...");

    const requestNonce =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);

    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    // ✅ Save nonce BEFORE redirect — page reload ke baad bhi available rahega
    sessionStorage.setItem("tc_nonce", requestNonce);
    sessionStorage.setItem("tc_polling", "true");

    // Trigger Mobile App Popup
    const tcLink = `truecallersdk://truesdk/web_verify?requestNonce=${requestNonce}&partnerKey=${partnerKey}&partnerName=Neelamrit&skipOption=faq`;
    window.location.href = tcLink;

    // ✅ FIX: Polling yahan bhi start karo — agar deep link same tab mein wapas aaye
    // (kuch Android devices pe page navigate nahi hota, sirf app open hoti hai)
    startPolling(requestNonce);
  };

  // Standard email/password signup
  async function handleSignup() {
    if (!form.full_name || !form.phone || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.phone.length !== 10) {
      setError("Enter valid 10-digit phone number");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { error: dbError } = await supabase
          .from("users_profile")
          .upsert(
            [{ id: authData.user.id, full_name: form.full_name, phone: form.phone, role: "customer" }],
            { onConflict: "phone" }
          );
        if (dbError) throw dbError;
      }

      window.location.href = "/login?registered=true";
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-200">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-amber-100/40 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-amber-50 blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row">

            {/* Lottie Animation */}
            <div className="flex-1 bg-gradient-to-br from-amber-50/50 to-white p-8 lg:p-12 flex flex-col items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl">
                <DotLottiePlayer src="/login-anim.lottie" autoplay loop />
              </div>
              <div className="text-center mt-6 lg:mt-8">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">Join the Family</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">Create an account to enjoy authentic sweets, track orders & get special offers.</p>
              </div>
            </div>

            {/* Signup Form */}
            <div className="flex-1 p-8 sm:p-12 lg:p-14">
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter mb-1">NEELAMRIT</h1>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.4em] opacity-80 leading-none">Sweets & Snacks</p>
              </div>

              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-[12px] font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                  ✓ {successMsg}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-[12px] font-bold text-red-800 flex items-center gap-2 animate-in shake duration-300">
                  ⚠️ {error}
                </div>
              )}

              {/* Truecaller 1-Click Button (Mobile only) */}
              <button
                onClick={handleTruecallerAuth}
                disabled={loading}
                className="w-full md:hidden mb-6 bg-[#0087FF] hover:bg-[#0073D9] text-white py-4 rounded-2xl text-[13px] font-black tracking-wide shadow-[0_8px_20px_-6px_rgba(0,135,255,0.5)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70 transition-all"
              >
                {loading && isPolling ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    WAITING FOR TRUECALLER...
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20.2 15.6c-.6-.6-1.5-.6-2.1 0l-2.4 2.4c-4.3-2.1-7.8-5.6-9.9-9.9l2.4-2.4c.6-.6.6-1.5 0-2.1l-4.5-4.5c-.6-.6-1.5-.6-2.1 0l-1.4 1.4C-.5 5.5.9 14.2 8.7 21.9c7.7 7.7 16.4 9.2 21.3 3.8l1.4-1.4c.6-.6.6-1.5 0-2.1l-4.5-4.5z" />
                    </svg>
                    1-CLICK SIGNUP WITH TRUECALLER
                  </>
                )}
              </button>

              <div className="md:hidden flex items-center gap-4 mb-6 opacity-40">
                <div className="flex-1 h-px bg-gray-400"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">OR MANUAL SIGNUP</span>
                <div className="flex-1 h-px bg-gray-400"></div>
              </div>

              {/* Manual Form */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Shubham Dwivedi"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-400 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number *</label>
                  <div className="flex bg-gray-50 border border-gray-100 focus-within:border-amber-400 focus-within:bg-white rounded-2xl overflow-hidden transition-all">
                    <span className="px-4 py-4 text-sm font-semibold text-gray-500 bg-gray-100 border-r border-gray-200">+91</span>
                    <input
                      type="tel"
                      placeholder="9876543210"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      className="w-full px-4 py-4 bg-transparent text-sm font-semibold text-gray-900 outline-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address *</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-400 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password *</label>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-400 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all placeholder:text-gray-400"
                  />
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="w-4 h-4 text-amber-900 bg-gray-50 border border-gray-300 rounded cursor-pointer mt-0.5"
                  />
                  <label className="text-[12px] font-medium text-gray-500 cursor-pointer">
                    I agree to the Terms & Conditions and Privacy Policy.
                  </label>
                </div>

                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className="w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] bg-amber-900 hover:bg-black text-white shadow-xl active:scale-95 mt-4 transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
                >
                  {loading && !isPolling ? "Creating Account..." : "Create Account"}
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-amber-900 font-black hover:underline">Sign In</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Secured badge */}
        <div className="mt-10 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">Secured by Neelamrit</span>
          </div>
        </div>
      </div>
    </div>
  );
}
