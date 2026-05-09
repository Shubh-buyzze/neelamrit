"use client";

/**
 * FILE: src/app/(auth)/complete-profile/page.tsx
 *
 * Shown ONLY after first Truecaller login (is_new_user = true).
 * - Naam = required (pre-filled from Truecaller if available, user can edit)
 * - Email = optional (pre-filled if Truecaller returned it)
 * - Address fields = optional (skip allowed)
 *
 * On submit → updates users_profile → sets profile_complete = true → go home
 * On skip   → sets profile_complete = true with just the name → go home
 *
 * Guard: If user is not logged in → redirect to /login
 *        If profile_complete = true → redirect to / (profile already done)
 */

import { useState, useEffect } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter } from "next/navigation";

type ProfileForm = {
  full_name:    string;
  email:        string;
  address_line: string;
  city:         string;
  state:        string;
  pincode:      string;
};

export default function CompleteProfilePage() {
  const router  = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [form, setForm]       = useState<ProfileForm>({
    full_name: "", email: "", address_line: "", city: "", state: "", pincode: "",
  });
  const [phone, setPhone]     = useState("");
  const [userId, setUserId]   = useState("");
  const [loading, setLoading] = useState(true);   // initial data fetch
  const [saving, setSaving]   = useState(false);  // form submit
  const [error, setError]     = useState("");
  const [nameError, setNameError] = useState("");

  // ── On mount: fetch current user + existing profile data ───────────────────
  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();

      if (userErr || !user) {
        router.replace("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("users_profile")
        .select("full_name, email, phone, profile_complete, address_line, city, state, pincode")
        .eq("id", user.id)
        .maybeSingle();

      // If profile already completed → skip this page
      if (profile?.profile_complete === true && profile?.full_name) {
        router.replace("/");
        return;
      }

      // Pre-fill whatever Truecaller gave us
      setPhone(profile?.phone || "");
      setForm({
        full_name:    profile?.full_name    || "",
        email:        profile?.email        || "",
        address_line: profile?.address_line || "",
        city:         profile?.city         || "",
        state:        profile?.state        || "",
        pincode:      profile?.pincode      || "",
      });
      setLoading(false);
    })();
  }, []);

  const set = (key: keyof ProfileForm, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Save full profile ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.full_name.trim()) {
      setNameError("नाम जरूरी है — यह आपके orders और profile में दिखेगा");
      return;
    }
    setNameError("");
    setSaving(true);
    setError("");

    const payload: Record<string, any> = {
      id:               userId,
      full_name:        form.full_name.trim(),
      profile_complete: true,
      updated_at:       new Date().toISOString(),
    };

    // Only include optional fields if user filled them
    if (form.email.trim())        payload.email        = form.email.trim();
    if (form.address_line.trim()) payload.address_line = form.address_line.trim();
    if (form.city.trim())         payload.city         = form.city.trim();
    if (form.state.trim())        payload.state        = form.state.trim();
    if (form.pincode.trim())      payload.pincode      = form.pincode.trim();

    const { error: upsertErr } = await supabase
      .from("users_profile")
      .upsert(payload, { onConflict: "id" });

    if (upsertErr) {
      setError(`Save नहीं हो सका: ${upsertErr.message}`);
      setSaving(false);
      return;
    }

    router.replace("/");
  };

  // ── Skip: save name (required) + mark complete ─────────────────────────────
  const handleSkip = async () => {
    if (!form.full_name.trim()) {
      setNameError("नाम भरना जरूरी है — बाकी सब skip हो सकता है");
      return;
    }
    setNameError("");
    setSaving(true);

    await supabase.from("users_profile").upsert(
      {
        id:               userId,
        full_name:        form.full_name.trim(),
        profile_complete: true,
        updated_at:       new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    router.replace("/");
  };

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-800 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm font-medium">Profile load हो रहा है...</p>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
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
            <span className="text-amber-700 font-semibold">Email और Address बाद में भी भर सकते हैं।</span>
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

          {/* Phone banner (read-only) */}
          {phone && (
            <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-3">
              <span className="text-emerald-600 text-lg">✅</span>
              <div>
                <p className="text-xs text-emerald-700 font-semibold">Truecaller से verify हुआ</p>
                <p className="text-sm text-emerald-900 font-black">+91 {phone}</p>
              </div>
            </div>
          )}

          <div className="p-7 space-y-5">

            {/* ── NAAM — required ─────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                आपका नाम <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => { set("full_name", e.target.value); setNameError(""); }}
                placeholder="जैसे: Rahul Sharma"
                className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none transition-colors
                  ${nameError ? "border-red-300 bg-red-50 focus:border-red-400" : "border-gray-200 focus:border-amber-400 focus:bg-white"}`}
              />
              {nameError && (
                <p className="text-red-500 text-xs font-semibold mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {nameError}
                </p>
              )}
            </div>

            {/* ── EMAIL — optional ────────────────────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Email{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="yourname@gmail.com"
                className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors"
              />
              <p className="text-gray-400 text-[11px] mt-1 ml-1">Order updates और invoice के लिए उपयोगी</p>
            </div>

            {/* ── ADDRESS — optional, collapsible ────────────────────────── */}
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
                Delivery Address{" "}
                <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
              </label>

              <div className="space-y-3">
                <input
                  type="text" value={form.address_line}
                  onChange={(e) => set("address_line", e.target.value)}
                  placeholder="घर/मकान नंबर, गली, मोहल्ला"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text" value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="शहर (City)"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                  />
                  <input
                    type="text" value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    placeholder="राज्य (State)"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                  />
                </div>
                <input
                  type="text" value={form.pincode} maxLength={6}
                  onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="PIN Code"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 placeholder-gray-400 outline-none focus:border-amber-400 focus:bg-white transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-semibold flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* ── Action buttons ───────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              {/* Skip: saves name only */}
              <button
                onClick={handleSkip}
                disabled={saving}
                className="flex-1 py-4 rounded-2xl text-xs font-black uppercase tracking-wider border-2 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 transition-all disabled:opacity-50"
              >
                {saving ? "..." : "बाद में भरूँगा →"}
              </button>

              {/* Save all */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-2 min-w-0 flex-[2] py-4 rounded-2xl text-xs font-black uppercase tracking-wider bg-amber-900 hover:bg-gray-900 text-white shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Save हो रहा है...
                  </span>
                ) : "Profile Save करें ✓"}
              </button>
            </div>

            <p className="text-center text-[11px] text-gray-400 leading-relaxed">
              यह जानकारी सिर्फ आपके orders और delivery के लिए use होगी।<br/>
              "बाद में भरूँगा" दबाने पर सिर्फ नाम save होगा।
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          आपका data सुरक्षित है। हम कभी share नहीं करते।
        </p>
      </div>
    </div>
  );
}