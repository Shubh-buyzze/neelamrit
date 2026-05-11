"use client";

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  FILE:  src/app/(auth)/complete-profile/page.tsx                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Shown once — after first Truecaller login (is_new_user = true).
 *
 * Fields:
 *   - Naam        REQUIRED  (pre-filled from Truecaller if available)
 *   - Email       optional  (pre-filled if Truecaller returned it)
 *   - Address     optional  (can skip entirely)
 *
 * On Save   → upsert users_profile → profile_complete = true → /
 * On Skip   → save naam only → profile_complete = true → /
 *
 * Guards:
 *   - Not logged in          → redirect /login
 *   - Profile already done   → redirect /
 */

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
        // Non-fatal — show empty form
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
  }, []);

  function setField(key: keyof ProfileForm, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (key === "full_name") setNameErr(""); // clear error on type
  }

  // ── Build upsert payload (only include non-empty optional fields) ──────────
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

  // ── Save all filled fields ─────────────────────────────────────────────────
  async function handleSave() {
    if (!form.full_name.trim()) {
      setNameErr("नाम जरूरी है — यह आपके orders में दिखेगा");
      return;
    }

    setPageState("saving");
    setSaveErr("");

    const { error } = await supabase
      .from("users_profile")
      .upsert(buildPayload(true), { onConflict: "id" });

    if (error) {
      console.error("[CompleteProfile] Save error:", error);
      setSaveErr(`Save नहीं हो सका: ${error.message}`);
      setPageState("ready");
      return;
    }

    router.replace("/");
  }

  // ── Skip — save naam only, mark complete ──────────────────────────────────
  async function handleSkip() {
    if (!form.full_name.trim()) {
      setNameErr("नाम जरूरी है — Email और Address skip हो सकते हैं");
      return;
    }

    setPageState("saving");

    const { error } = await supabase
      .from("users_profile")
      .upsert(buildPayload(false), { onConflict: "id" });

    if (error) {
      console.error("[CompleteProfile] Skip save error:", error);
      setSaveErr(`Save नहीं हो सका: ${error.message}`);
      setPageState("ready");
      return;
    }

    router.replace("/");
  }

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Profile load हो रहा है...</p>
        </div>
      </div>
    );
  }

  const isSaving = pageState === "saving";

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/60 via-white to-orange-50/40 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-100 mb-4">
            <span className="text-3xl">🙏</span>
          </div>
          <h1 className="font-serif text-3xl font-black text-gray-900 tracking-tight">
            स्वागत है NEELAMRIT में!
          </h1>
          <p className="text-gray-500 text-sm mt-2 leading-relaxed">
            एक बार अपना नाम confirm करें।<br />
            <span className="text-amber-700 font-semibold">
              Email और Address बाद में भी भर सकते हैं।
            </span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Verified phone banner */}
          {phone && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4 flex items-center gap-3">
              <span className="text-emerald-600 text-xl">✅</span>
              <div>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wide">
                  Truecaller से Verified
                </p>
                <p className="text-base text-emerald-900 font-black tracking-wide">
                  +91 {phone}
                </p>
              </div>
            </div>
          )}

          <div className="p-7 space-y-6">

            {/* ── NAAM — required ─────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                आपका नाम{" "}
                <span className="text-red-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                placeholder="जैसे: Rahul Sharma"
                disabled={isSaving}
                autoComplete="name"
                className={[
                  "w-full px-5 py-4 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-colors border",
                  nameErr
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-gray-200 bg-gray-50 focus:border-amber-400 focus:bg-white",
                  isSaving ? "opacity-60" : "",
                ].join(" ")}
              />
              {nameErr && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {nameErr}
                </p>
              )}
            </div>

            {/* ── EMAIL — optional ────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Email{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                placeholder="yourname@gmail.com"
                disabled={isSaving}
                autoComplete="email"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
              />
              <p className="text-gray-400 text-[11px] mt-1.5 ml-1">
                Order updates, invoices और password reset के लिए जरूरी
              </p>
            </div>

            {/* ── ADDRESS — optional ──────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Delivery Address{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <div className="space-y-3">
                <input
                  type="text"
                  value={form.address_line}
                  onChange={(e) => setField("address_line", e.target.value)}
                  placeholder="घर/मकान नंबर, गली, मोहल्ला"
                  disabled={isSaving}
                  autoComplete="street-address"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setField("city", e.target.value)}
                    placeholder="शहर (City)"
                    disabled={isSaving}
                    autoComplete="address-level2"
                    className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
                  />
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => setField("state", e.target.value)}
                    placeholder="राज्य (State)"
                    disabled={isSaving}
                    autoComplete="address-level1"
                    className="px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
                  />
                </div>
                <input
                  type="text"
                  value={form.pincode}
                  maxLength={6}
                  onChange={(e) => setField("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="PIN Code (6 अंक)"
                  disabled={isSaving}
                  autoComplete="postal-code"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors disabled:opacity-60"
                />
              </div>
            </div>

            {/* Save error */}
            {saveErr && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span> {saveErr}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-1">
              {/* Skip — saves naam only */}
              <button
                onClick={handleSkip}
                disabled={isSaving}
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-wider border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                बाद में →
              </button>

              {/* Save all */}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Save हो रहा है...
                  </span>
                ) : (
                  "Profile Save करें ✓"
                )}
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 leading-relaxed">
              &quot;बाद में&quot; दबाने पर सिर्फ नाम save होगा।<br />
              बाकी details profile settings में कभी भी add करें।
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          आपका data सुरक्षित है। हम कभी share नहीं करते। 🔒
        </p>
      </div>
    </div>
  );
}