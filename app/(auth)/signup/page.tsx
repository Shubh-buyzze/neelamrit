"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Dynamic import for Lottie player (SSR disabled)
const DotLottiePlayer = dynamic(
  () => import("@dotlottie/react-player").then((mod) => mod.DotLottiePlayer),
  { ssr: false }
);

export default function SignupPage() {
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
  });
  
  const [acceptedTerms, setAcceptedTerms] = useState(false); // 🟢 NEW: Checkbox State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!form.full_name || !form.phone || !form.email || !form.password) {
      setError("All fields are required");
      return;
    }
    if (form.phone.length !== 10) {
      setError("Enter valid 10-digit phone number");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    // 🟢 NEW: Mandatory Terms and Conditions Validation
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }

    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const result = await res.json();
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      window.location.href = "/login?registered=true";
    }
  }

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-200">
      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-amber-100/40 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-amber-50 blur-[120px]"></div>
      </div>

      {/* Main container: split on desktop, stacked on mobile */}
      <div className="relative w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row">
            {/* LEFT SIDE - Lottie Animation */}
            <div className="flex-1 bg-gradient-to-br from-amber-50/50 to-white p-8 lg:p-12 flex flex-col items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl">
                <DotLottiePlayer
                  src="/login-anim.lottie"
                  autoplay
                  loop
                />
              </div>
              <div className="text-center mt-6 lg:mt-8">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                  Join the Family
                </h2>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  Create an account to enjoy authentic sweets, track orders & get special offers.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Signup Form */}
            <div className="flex-1 p-8 sm:p-12 lg:p-14">
              {/* Brand header */}
              <div className="text-center mb-8">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter mb-1">
                  NEELAMRIT
                </h1>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.4em] opacity-80 leading-none">
                  Sweets & Snacks
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-[12px] font-bold text-red-800 flex items-center gap-2 animate-in shake duration-300">
                  <span className="text-lg">⚠️</span> {error}
                </div>
              )}

              {/* Form fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Shubham Dwivedi"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">+91</span>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
                      placeholder="9876543210"
                      className="w-full px-5 py-4 pl-12 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Min. 6 characters"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300 placeholder:text-gray-300"
                  />
                </div>

                {/* 🟢 NEW: Terms & Conditions Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="w-4 h-4 text-amber-900 bg-gray-50 border border-gray-300 rounded focus:ring-amber-900 focus:ring-2 cursor-pointer transition-colors"
                    />
                  </div>
                  <label htmlFor="terms" className="text-[12px] font-medium text-gray-500 leading-snug cursor-pointer">
                    I agree to the{" "}
                    <Link href="/terms" className="text-amber-900 hover:text-black font-bold transition-colors">Terms & Conditions</Link>
                    {" "}and{" "}
                    <Link href="/privacy" className="text-amber-900 hover:text-black font-bold transition-colors">Privacy Policy</Link>.
                  </label>
                </div>

                {/* Signup button */}
                <button
                  onClick={handleSignup}
                  disabled={loading}
                  className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 shadow-xl active:scale-95 mt-4
                    ${loading 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                      : "bg-amber-900 text-white hover:bg-black hover:shadow-amber-900/20"
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      Creating Account...
                    </div>
                  ) : "Create Account"}
                </button>
              </div>

              {/* Login redirect */}
              <div className="mt-8 pt-6 border-t border-gray-50 text-center">
                <p className="text-sm font-medium text-gray-500">
                  Already have an account?{" "}
                  <Link href="/login" className="text-amber-900 font-black hover:underline ml-1">
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Secured by Neelamrit - consistent with login */}
        <div className="mt-10 flex flex-col items-center gap-3 opacity-60 hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-700">
              Secured by Neelamrit
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}