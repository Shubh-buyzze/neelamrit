// app/login/page.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";
import Script from "next/script"; // 🟢 Script Import Added

// Dynamic import for Lottie player (SSR disabled)
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
  
  // 🟢 TC Loaded State
  const [isTcLoaded, setIsTcLoaded] = useState(false); 

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("registered") === "true") {
      setSuccessMsg("Account created successfully! Please login to your account.");
    }
  }, []);

  // 🟢 Initialization logic triggered AFTER script completely loads
  const initTruecaller = () => {
    if (typeof window !== "undefined" && (window as any).Truecaller) {
      (window as any).Truecaller.init({
        partnerKey: process.env.NEXT_PUBLIC_TRUECALLER_KEY,
        callback: async (tcError: any, response: any) => {
          if (tcError) {
            setError("Truecaller login was cancelled or failed.");
            return;
          }

          setLoading(true);
          try {
            const profile = response; 
            const fullName = `${profile.firstName || ""} ${profile.lastName || ""}`.trim();
            const phone = profile.phoneNumber;

            const { error: dbError } = await supabase
              .from("users_profile")
              .upsert({
                phone: phone,
                full_name: fullName,
                avatar_url: profile.avatarUrl || null,
                role: "customer" 
              }, { onConflict: "phone" });

            if (!dbError) {
              setSuccessMsg("Login Successful! Redirecting...");
              window.location.href = "/";
            } else {
              setError("Could not save profile to database.");
              setLoading(false);
            }
          } catch (err) {
            setError("An unexpected error occurred during Truecaller login.");
            setLoading(false);
          }
        },
      });
      setIsTcLoaded(true); // Mark as successfully initialized
    }
  };

  async function handleLogin() {
    if (!email || !password) {
      setError("Please enter both email and password");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const result = await res.json();
      setLoading(false);

      if (!result.success) {
        setError(result.error);
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setLoading(false);
      setError("An unexpected error occurred. Please try again.");
    }
  }

  const handleTruecallerClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    
    // Check if loaded properly
    if (isTcLoaded && typeof window !== "undefined" && (window as any).Truecaller) {
      (window as any).Truecaller.prompt(); 
    } else {
      setError("Truecaller is blocked or still loading. Try disabling Ad-Blocker if enabled.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-200">
      
      {/* 🟢 NEXT.JS SCRIPT TAG WITH onLoad EVENT */}
      <Script 
        src="https://one-tap-sdk.truecaller.com/v1/sdk.js" 
        strategy="afterInteractive" 
        onLoad={initTruecaller} 
      />

      {/* Background decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-amber-100/40 blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[45%] h-[45%] rounded-full bg-amber-50 blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden backdrop-blur-sm">
          <div className="flex flex-col lg:flex-row">
            
            {/* LEFT SIDE - Lottie Animation */}
            <div className="flex-1 bg-gradient-to-br from-amber-50/50 to-white p-8 lg:p-12 flex flex-col items-center justify-center">
              <div className="w-64 h-64 sm:w-80 sm:h-80 drop-shadow-xl">
                <DotLottiePlayer src="/login-anim.lottie" autoplay loop />
              </div>
              <div className="text-center mt-6 lg:mt-8">
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-sm text-gray-500 mt-2 max-w-xs mx-auto">
                  Sign in to continue your sweet journey with Neelamrit.
                </p>
              </div>
            </div>

            {/* RIGHT SIDE - Login Form */}
            <div className="flex-1 p-8 sm:p-12 lg:p-14">
              <div className="text-center mb-10">
                <h1 className="font-serif text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter mb-1">
                  NEELAMRIT
                </h1>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-[0.4em] opacity-80 leading-none">
                  Sweets & Snacks
                </p>
              </div>

              {successMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-[12px] font-bold text-emerald-800 flex items-center gap-2">
                  <span className="text-lg">✓</span> {successMsg}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-[12px] font-bold text-red-800 flex items-center gap-2">
                  <span className="text-lg">⚠️</span> {error}
                </div>
              )}

              {/* 🟢 TRUECALLER BUTTON */}
              <button
                onClick={handleTruecallerClick}
                disabled={loading}
                className="w-full mb-6 bg-[#0087FF] text-white hover:bg-[#0073D9] py-4 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-300 shadow-[0_8px_20px_-6px_rgba(0,135,255,0.5)] flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20.2 15.6c-.6-.6-1.5-.6-2.1 0l-2.4 2.4c-4.3-2.1-7.8-5.6-9.9-9.9l2.4-2.4c.6-.6.6-1.5 0-2.1l-4.5-4.5c-.6-.6-1.5-.6-2.1 0l-1.4 1.4C-.5 5.5.9 14.2 8.7 21.9c7.7 7.7 16.4 9.2 21.3 3.8l1.4-1.4c.6-.6.6-1.5 0-2.1l-4.5-4.5z" />
                </svg>
                {loading ? "VERIFYING..." : "1-CLICK LOGIN WITH TRUECALLER"}
              </button>

              {/* DIVIDER */}
              <div className="flex items-center gap-4 mb-6 opacity-60">
                <div className="flex-1 h-px bg-gray-300"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">OR EMAIL</span>
                <div className="flex-1 h-px bg-gray-300"></div>
              </div>

              {/* Form fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5 ml-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@mail.com"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full px-6 py-4.5 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2.5 ml-1">
                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Password</label>
                    <Link href="/forgot-password" className="text-[10px] font-bold text-amber-900/60 hover:text-amber-900 hover:underline">Reset Password?</Link>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                    className="w-full px-6 py-4.5 bg-gray-50 border border-gray-100 focus:border-amber-200 focus:bg-white rounded-2xl text-sm font-semibold text-gray-900 outline-none transition-all duration-300"
                  />
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className={`w-full py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] transition-all duration-500 shadow-xl active:scale-95
                    ${loading ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" : "bg-amber-900 text-white hover:bg-black hover:shadow-amber-900/20"}`}
                >
                  {loading ? "Verifying..." : "Sign In to Account"}
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-50 text-center">
                <p className="text-sm font-medium text-gray-500">
                  New to our family? <Link href="/signup" className="text-amber-900 font-black hover:underline ml-1">Create Account</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

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