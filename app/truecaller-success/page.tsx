"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function SuccessContent() {
  const searchParams = useSearchParams();
  const [msg, setMsg] = useState("Verifying your profile...");
  const nonce = searchParams.get("nonce");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!nonce) return;

    const checkAndLogin = async () => {
      try {
        const res = await fetch(`/api/truecaller/status?nonce=${nonce}`);
        const data = await res.json();

        if (data.status === "success") {
          setMsg("Login successful! Redirecting to Home...");
          
          const { error } = await supabase.auth.signInWithPassword({
            email: `${data.phone}@neelamrit.com`,
            password: data.temp_password
          });

          if (!error) {
            // 🟢 CRITICAL: Force full reload to sync profile globally
            window.location.assign("/"); 
          } else {
            setMsg("Auth error. Please login manually.");
          }
        }
      } catch (err) {
        setMsg("Network error. Please refresh.");
      }
    };

    const interval = setInterval(checkAndLogin, 1500);
    return () => clearInterval(interval);
  }, [nonce, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="text-center p-10 bg-white rounded-[3rem] shadow-xl max-w-sm w-full border border-gray-100">
        <h1 className="font-serif text-3xl font-black mb-6 text-gray-900">NEELAMRIT</h1>
        <div className="w-10 h-10 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-5"></div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">{msg}</p>
      </div>
    </div>
  );
}

export default function TruecallerSuccess() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fafaf9]" />}>
      <SuccessContent />
    </Suspense>
  );
}