"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const nonce = searchParams.get("nonce");
  const [status, setStatus] = useState("Verifying Truecaller login...");

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (!nonce) {
      router.push("/login?error=missing_nonce");
      return;
    }

    const loginUser = async () => {
      try {
        const res = await fetch(`/api/truecaller/status?nonce=${nonce}`);
        const data = await res.json();

        if (data.status === "success") {
          setStatus("Logging you in securely...");
          const { error } = await supabase.auth.signInWithPassword({
            email: `${data.phone}@neelamrit.com`,
            password: data.temp_password
          });

          if (error) throw error;
          window.location.href = "/"; // Login Done! Redirect to Home
        } else {
          router.push("/login?error=verification_failed");
        }
      } catch (err) {
        router.push("/login?error=auth_error");
      }
    };

    loginUser();
  }, [nonce, router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf9]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-amber-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="font-bold text-gray-800 tracking-wide">{status}</p>
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