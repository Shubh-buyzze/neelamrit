"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import { createBrowserClient } from "@supabase/ssr";

export const dynamic = 'force-dynamic'

const DotLottiePlayer = nextDynamic(
  () => import("@dotlottie/react-player").then((m) => m.DotLottiePlayer),
  { ssr: false }
);

function generateNonce(): string {
  const a = Math.random().toString(36).slice(2, 12);
  const b = Date.now().toString(36);
  const c = Math.random().toString(36).slice(2, 8);
  return `${a}${b}${c}`; 
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [manualStep, setManualStep] = useState<1 | 2>(1);

  const [tcStatus, setTcStatus] = useState<"idle" | "loading" | "polling" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const killRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const supabase = createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key")
  );

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
    return () => stopPolling();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("auto") === "true") {
      const timer = setTimeout(() => {
        handleTruecallerLogin();
      }, 800);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (killRef.current) { clearTimeout(killRef.current); killRef.current = null; }
  }

  function showError(msg: string) {
    stopPolling();
    setTcStatus("error");
    setErrorMsg(msg);
    setStatusMsg("");
  }

  function handleTruecallerLogin() {
    setTcStatus("loading");
    setStatusMsg("Opening Truecaller...");
    setErrorMsg("");

    const nonce = generateNonce();
    const partnerKey = process.env.NEXT_PUBLIC_TRUECALLER_KEY;

    window.location.href = [
      "truecallersdk://truesdk/web_verify",
      `?requestNonce=${nonce}`,
      `&partnerKey=${partnerKey}`,
      `&partnerName=Neelamrit`,
      `&lang=en`,
      `&title=logIn`,
      `&skipOption=useDifferentNumber`,
    ].join("");

    const pollDelay = setTimeout(() => {
      setTcStatus("polling");
      setStatusMsg("Awaiting approval in Truecaller...");

      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/truecaller/status?nonce=${encodeURIComponent(nonce)}&_=${Date.now()}`,
            {
              cache: "no-store",
              headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
            }
          );

          if (!res.ok) return;

          const data = await res.json();
          if (data.status !== "success") return;

          stopPolling();
          setTcStatus("success");
          setStatusMsg("Verification successful. Logging in...");

          const ghostEmail = `${data.phone}@neelamrit.com`;

          const { error: authErr } = await supabase.auth.signInWithPassword({
            email: ghostEmail,
            password: data.temp_password,
          });

          if (authErr) {
            showError("Authentication failed. Please try again.");
            return;
          }

          localStorage.setItem("neelamrit_auth_flag", "true");
          window.location.assign(data.is_new_user ? "/complete-profile" : "/");

        } catch (fetchErr: unknown) {
          console.warn("[TC-Poll] Fetch error (will retry):", fetchErr);
        }
      }, 2000); 
    }, 800);

    killRef.current = setTimeout(() => {
      clearTimeout(pollDelay);
      showError("Request timed out. Please try again.");
    }, 90_000);
  }

  function handleEmailContinue() {
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setManualStep(2);
  }

  async function handlePasswordSubmit() {
    if (!password.trim()) { 
      setErrorMsg("Please enter your password."); 
      return; 
    }

    setTcStatus("loading");
    setStatusMsg("Authenticating...");
    setErrorMsg("");

    const { error: authErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (authErr) {
      setTcStatus("error");
      setErrorMsg(
        authErr.message === "Invalid login credentials"
          ? "Incorrect email or password."
          : authErr.message
      );
      setStatusMsg("");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      localStorage.setItem("neelamrit_auth_flag", "true");

      const { data: prof } = await supabase
        .from("users_profile")
        .select("profile_complete, full_name")
        .eq("id", user.id)
        .maybeSingle();

      if (prof && prof.profile_complete === false && !prof.full_name) {
        window.location.assign("/complete-profile");
        return;
      }
    }

    window.location.assign("/");
  }

  const isLoading = tcStatus === "loading" || tcStatus === "polling";
  const isSuccess = tcStatus === "success";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans text-gray-900">
      <div className="relative w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">

        <div className="flex-1 bg-gray-50 p-12 hidden md:flex flex-col items-center justify-center border-r border-gray-100">
          <DotLottiePlayer src="/login-anim.lottie" autoplay loop className="w-64 h-64" />
          <h2 className="font-serif text-2xl font-medium text-gray-900 mt-6 tracking-tight text-center">
            Welcome Back
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center tracking-wide">
            Authentic Neelam & Gemstones
          </p>
        </div>

        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center">

          <div className="mb-8">
            <h1 className="font-serif text-3xl font-semibold text-gray-900 tracking-tight">
              NEELAMRIT
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Sign in to your account
            </p>
          </div>

          {statusMsg && (
            <div className="mb-6 flex items-center gap-3 text-sm font-medium text-gray-700 animate-in fade-in duration-300">
              <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              {statusMsg}
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex justify-between items-center animate-in fade-in">
              <span>{errorMsg}</span>
              {tcStatus === "error" && (
                <button
                  onClick={() => { setTcStatus("idle"); setErrorMsg(""); }}
                  className="text-red-500 hover:text-red-700 underline text-xs ml-4"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}

          {isMobile && manualStep === 1 && (
            <div className="mb-6 animate-in fade-in">
              <button
                onClick={handleTruecallerLogin}
                disabled={isLoading || isSuccess}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <img src="/truecaller-logo.webp" alt="Truecaller Icon" className="w-5 h-5 object-contain" />
                <span>1-click Login with</span>
                <img src="/truecaller-text.webp" alt="Truecaller" className="h-4 object-contain mt-0.5" />
              </button>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[10px] uppercase text-gray-400 font-semibold tracking-widest">
                  Or use email
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          <div className="space-y-5">
            {manualStep === 1 ? (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailContinue(); }}
                  placeholder="Enter your email"
                  disabled={isLoading || isSuccess}
                  autoComplete="email"
                  className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
                />
                <button
                  onClick={handleEmailContinue}
                  disabled={isLoading || isSuccess}
                  className="w-full mt-4 py-3 rounded-md text-sm font-medium bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="flex justify-between items-center mb-4 p-3 border border-gray-200 rounded-md bg-gray-50">
                  <span className="text-sm text-gray-600 truncate mr-4">{email}</span>
                  <button 
                    onClick={() => { setManualStep(1); setErrorMsg(""); setPassword(""); }}
                    disabled={isLoading}
                    className="text-xs font-medium text-gray-900 underline hover:text-gray-600 disabled:opacity-50"
                  >
                    Change
                  </button>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handlePasswordSubmit(); }}
                  placeholder="Enter your password"
                  disabled={isLoading || isSuccess}
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-900 focus:ring-1 focus:ring-gray-900 disabled:opacity-50"
                />
                
                <button
                  onClick={handlePasswordSubmit}
                  disabled={isLoading || isSuccess}
                  className="w-full mt-5 py-3 flex justify-center items-center gap-2 rounded-md text-sm font-medium bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-70"
                >
                  {isLoading && tcStatus === "loading" ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link href="/signup" className="text-gray-900 font-medium hover:underline ml-1">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}