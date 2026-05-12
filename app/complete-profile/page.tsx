"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

type ProfileForm = {
  full_name:    string;
  email:        string;
  address_line: string;
  city:         string;
  state:        string;
  pincode:      string;
};

const EMPTY_FORM: ProfileForm = {
  full_name: "", email: "", address_line: "", city: "", state: "", pincode: "",
};

export default function CompleteProfilePage() {
  const router   = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [form,      setForm]      = useState<ProfileForm>(EMPTY_FORM);
  const [phone,     setPhone]     = useState("");
  const [userId,    setUserId]    = useState("");
  const [pageState, setPageState] = useState<"loading" | "ready" | "saving" | "done">("loading");
  const [saveErr,   setSaveErr]   = useState("");
  const [nameErr,   setNameErr]   = useState("");
  
  // New state to manage form steps (1: Personal, 2: Address)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // ── Load user + existing profile on mount ──────────────────────────────────
  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile, error: profErr } = await supabase
        .from("users_profile")
        .select("full_name, email, phone, profile_complete, address_line, city, state, pincode")
        .eq("id", user.id)
        .maybeSingle();

      if (profErr) {
        console.error("[CompleteProfile] Profile fetch error:", profErr);
      }

      // Already completed → skip this page
      if (profile?.profile_complete === true && profile?.full_name) {
        router.replace("/");
        return;
      }

      setPhone(profile?.phone ?? "");
      setForm({
        full_name:    profile?.full_name    ?? "",
        email:        profile?.email        ?? "",
        address_line: profile?.address_line ?? "",
        city:         profile?.city         ?? "",
        state:        profile?.state        ?? "",
        pincode:      profile?.pincode      ?? "",
      });

      setPageState("ready");
    })();
  }, [router, supabase]);

  function setField(key: keyof ProfileForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (key === "full_name") setNameErr(""); 
  }

  // ── Build upsert payload ───────────────────────────────────────────────────
  function buildPayload(includeOptional: boolean): Record<string, unknown> {
    const now     = new Date().toISOString();
    const payload: Record<string, unknown> = {
      id:               userId,
      full_name:        form.full_name.trim(),
      profile_complete: true,
      updated_at:       now,
    };

    if (includeOptional) {
      if (form.email.trim())        payload.email        = form.email.trim();
      if (form.address_line.trim()) payload.address_line = form.address_line.trim();
      if (form.city.trim())         payload.city         = form.city.trim();
      if (form.state.trim())        payload.state        = form.state.trim();
      if (form.pincode.trim())      payload.pincode      = form.pincode.trim();
    }

    return payload;
  }

  // ── Step Navigation Logic ──────────────────────────────────────────────────
  function handleNextStep() {
    if (!form.full_name.trim()) {
      setNameErr("Full name is required");
      return;
    }
    setCurrentStep(2);
  }

  function handlePreviousStep() {
    setCurrentStep(1);
    setSaveErr("");
  }

  // ── Save all filled fields ─────────────────────────────────────────────────
  async function handleSave() {
    if (!form.full_name.trim()) {
      setCurrentStep(1);
      setNameErr("Full name is required");
      return;
    }

    setPageState("saving");
    setSaveErr("");

    const { error } = await supabase
      .from("users_profile")
      .upsert(buildPayload(true), { onConflict: "id" });

    if (error) {
      console.error("[CompleteProfile] Save error:", error);
      setSaveErr(`Unable to save: ${error.message}`);
      setPageState("ready");
      return;
    }

    router.replace("/");
  }

  // ── Skip — save naam only, mark complete ──────────────────────────────────
  async function handleSkip() {
    if (!form.full_name.trim()) {
      setCurrentStep(1);
      setNameErr("Full name is required");
      return;
    }

    setPageState("saving");
    setSaveErr("");

    const { error } = await supabase
      .from("users_profile")
      .upsert(buildPayload(false), { onConflict: "id" });

    if (error) {
      console.error("[CompleteProfile] Skip save error:", error);
      setSaveErr(`Unable to save: ${error.message}`);
      setPageState("ready");
      return;
    }

    router.replace("/");
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
      </div>
    );
  }

  const isSaving = pageState === "saving";

  // ── Main UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Progress Indicator */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs tracking-wide text-gray-500 uppercase">
            Step {currentStep} of 2
          </span>
          <div className="flex gap-1">
            <div className={`h-1 w-8 rounded-full ${currentStep >= 1 ? "bg-gray-800" : "bg-gray-200"}`} />
            <div className={`h-1 w-8 rounded-full ${currentStep >= 2 ? "bg-gray-800" : "bg-gray-200"}`} />
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* ── STEP 1: Personal Details ── */}
          {currentStep === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h1 className="text-xl font-medium text-gray-900 tracking-tight">
                  Personal Information
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Please verify your basic details to continue.
                </p>
              </div>

              {phone && (
                <div className="mb-6 pb-6 border-b border-gray-100">
                  <span className="block text-xs text-gray-400 uppercase tracking-wide mb-1">
                    Verified Mobile Number
                  </span>
                  <span className="text-sm font-medium text-gray-900">+91 {phone}</span>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setField("full_name", e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                    className={`w-full px-4 py-2.5 rounded-md text-sm bg-white border transition-colors outline-none ${
                      nameErr 
                        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500" 
                        : "border-gray-300 focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                    }`}
                  />
                  {nameErr && <p className="text-red-500 text-xs mt-1.5">{nameErr}</p>}
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Email Address <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-800 focus:ring-1 focus:ring-gray-800"
                  />
                </div>

                <div className="pt-4">
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3 rounded-md text-sm font-medium bg-gray-900 text-white transition-colors hover:bg-gray-800"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: Address Details ── */}
          {currentStep === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h1 className="text-xl font-medium text-gray-900 tracking-tight">
                  Delivery Address
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Where should we deliver your orders?
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Street Address
                  </label>
                  <input
                    type="text"
                    value={form.address_line}
                    onChange={(e) => setField("address_line", e.target.value)}
                    placeholder="House number, building, street"
                    disabled={isSaving}
                    autoComplete="street-address"
                    className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-800 focus:ring-1 focus:ring-gray-800 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">
                      City
                    </label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setField("city", e.target.value)}
                      placeholder="City"
                      disabled={isSaving}
                      autoComplete="address-level2"
                      className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-800 focus:ring-1 focus:ring-gray-800 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1.5">
                      State
                    </label>
                    <input
                      type="text"
                      value={form.state}
                      onChange={(e) => setField("state", e.target.value)}
                      placeholder="State"
                      disabled={isSaving}
                      autoComplete="address-level1"
                      className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-800 focus:ring-1 focus:ring-gray-800 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1.5">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    maxLength={6}
                    onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="6-digit pincode"
                    disabled={isSaving}
                    autoComplete="postal-code"
                    className="w-full px-4 py-2.5 rounded-md text-sm bg-white border border-gray-300 outline-none transition-colors focus:border-gray-800 focus:ring-1 focus:ring-gray-800 disabled:opacity-50"
                  />
                </div>
              </div>

              {saveErr && (
                <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-100 text-red-600 text-sm">
                  {saveErr}
                </div>
              )}

              <div className="mt-8 space-y-3">
                <div className="flex gap-3">
                  <button
                    onClick={handlePreviousStep}
                    disabled={isSaving}
                    className="px-4 py-3 rounded-md text-sm font-medium border border-gray-300 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1 py-3 rounded-md text-sm font-medium bg-gray-900 text-white transition-colors hover:bg-gray-800 disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Complete Setup"
                    )}
                  </button>
                </div>
                
                <button
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="w-full py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors disabled:opacity-50"
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}