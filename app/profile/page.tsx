"use client";

import { useEffect, useState } from "react";
import LocationPicker from "@/components/LocationPicker";

export const dynamic = 'force-dynamic'

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  district?: string;
  country?: string;
  is_default: boolean;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAddressListOpen, setIsAddressListOpen] = useState(true);

  const [showAddAddress, setShowAddAddress] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [savingAddress, setSavingAddress] = useState(false);

  const [addressForm, setAddressForm] = useState({
    first_name: "", last_name: "", phone: "", address_line1: "",
    address_line2: "", city: "", state: "", pincode: "", district: "", country: "India", set_default: false
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", phone: "" });

  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchAddresses();
    // Trigger banner animation after mount
    const t = setTimeout(() => setBannerVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const json = await res.json();
        setProfile(json.data);
        setProfileForm({ full_name: json.data?.full_name || "", phone: json.data?.phone || "" });
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
  }

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const json = await res.json();
        setAddresses(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    if (!profileForm.full_name?.trim()) return alert("Full name is required.");
    setSavingProfile(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const result = await res.json();
      if (result.success) {
        setProfile((prev: any) => ({ ...prev, full_name: result.data.full_name, phone: result.data.phone }));
        setIsEditingProfile(false);
      } else {
        alert("Error: " + result.error);
      }
    } catch {
      alert("Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelEditProfile() {
    setProfileForm({ full_name: profile?.full_name || "", phone: profile?.phone || "" });
    setIsEditingProfile(false);
  }

  function handleEditAddress(addr: Address) {
    const nameParts = addr.full_name.split(" ");
    setAddressForm({
      first_name: nameParts[0] || "",
      last_name: nameParts.slice(1).join(" ") || "",
      phone: addr.phone,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2 || "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      district: addr.district || "",
      country: addr.country || "India",
      set_default: addr.is_default
    });
    setEditingAddressId(addr.id);
    setShowAddAddress(true);
    if (!isAddressListOpen) setIsAddressListOpen(true);
  }

  function openNewAddressForm() {
    setAddressForm({ first_name: "", last_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "", pincode: "", district: "", country: "India", set_default: false });
    setEditingAddressId(null);
    setShowAddAddress(true);
    if (!isAddressListOpen) setIsAddressListOpen(true);
  }

  function closeAddressForm() {
    setShowAddAddress(false);
    setEditingAddressId(null);
  }

  async function saveAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!addressForm.first_name || !addressForm.phone || !addressForm.address_line1 || !addressForm.city) {
      return alert("Please fill all required fields.");
    }
    setSavingAddress(true);
    const endpoint = editingAddressId ? `/api/addresses/${editingAddressId}` : "/api/addresses";
    const method = editingAddressId ? "PUT" : "POST";
    const full_name = `${addressForm.first_name} ${addressForm.last_name}`.trim();
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name, phone: addressForm.phone, address_line1: addressForm.address_line1, address_line2: addressForm.address_line2, city: addressForm.city, state: addressForm.state, pincode: addressForm.pincode, district: addressForm.district, country: addressForm.country }),
      });
      const result = await res.json();
      if (result.success) {
        if (addressForm.set_default && !result.data.is_default) await setDefault(result.data.id);
        if (editingAddressId) {
          setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? { ...result.data, is_default: addressForm.set_default } : a)));
        } else {
          if (addressForm.set_default) fetchAddresses();
          else setAddresses((prev) => [result.data, ...prev]);
        }
        closeAddressForm();
      } else {
        alert("Error: " + result.error);
      }
    } catch {
      alert("Failed to save address.");
    } finally {
      setSavingAddress(false);
    }
  }

  async function setDefault(id: string) {
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "PATCH" });
      if (res.ok) setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
    } catch {
      alert("Failed to set default address.");
    }
  }

  async function deleteAddress(id: string) {
    if (!confirm("Are you sure you want to delete this address?")) return;
    try {
      const res = await fetch(`/api/addresses/${id}`, { method: "DELETE" });
      if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      alert("Failed to delete address.");
    }
  }

  const displayName = profile?.full_name?.split(" ")[0] || profile?.email?.split("@")[0] || "User";
  const initials = (profile?.full_name || displayName).split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);
  const isVerified = Boolean(profile?.full_name?.trim() && profile?.phone?.trim());
  const joinDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" })
    : "New";

  const inputClass = "w-full bg-white border border-gray-200 text-gray-900 text-sm rounded px-3.5 py-2.5 outline-none focus:border-gray-400 transition-all font-light";
  const inputActiveClass = "w-full bg-white border border-gray-900 text-gray-900 text-sm rounded px-3.5 py-2.5 outline-none focus:ring-1 focus:ring-gray-900 transition-all font-light";
  const floatLabel = "absolute left-3 top-1.5 text-[10px] font-medium text-gray-400 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-sm peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-gray-600";

  return (
    <div
      className="min-h-screen bg-[#f7f7f5] pb-20"
      style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* Inject keyframes */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .banner-enter { animation: slideDown 0.55s cubic-bezier(.22,1,.36,1) both; }
        .shimmer-line {
          background: linear-gradient(90deg, #f0ebe3 25%, #e8dfd3 50%, #f0ebe3 75%);
          background-size: 800px 100%;
          animation: shimmer 1.8s infinite linear;
        }
      `}</style>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ── PAGE HEADER ──────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <a
            href="/"
            className="w-9 h-9 rounded-full border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:border-gray-400 hover:text-gray-900 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">My Account</h1>
            <p className="text-xs text-gray-400 font-light mt-0.5 tracking-wide">Manage your profile, addresses and settings</p>
          </div>
        </div>

        {/* ── BECOME PARTNER BANNER ────────────────────────────── */}
        {bannerVisible && (
          <div className="banner-enter mb-7 overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 relative">
            {/* Decorative stripe */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-400 rounded-l-xl" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 pl-8">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900">Earn with Neelamrit Partner Program</p>
                  <p className="text-xs text-amber-700 font-light mt-0.5">Share your referral code and earn commission on every delivered order. Minimum withdrawal: Rs. 500.</p>
                </div>
              </div>
              <a
                href="/profile/partner"
                className="flex-shrink-0 h-9 px-5 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium tracking-wide transition-all whitespace-nowrap flex items-center gap-1.5"
              >
                View Dashboard
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
          <div className="w-full lg:w-64 flex-shrink-0 space-y-4">

            {/* Profile Card */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <div className="px-5 py-5 flex items-center gap-4 border-b border-gray-50">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-800 font-semibold text-base flex-shrink-0 uppercase">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-0.5">Hello,</p>
                  <h2 className="font-semibold text-gray-900 text-sm truncate">{displayName}</h2>
                  <p className="text-[11px] text-gray-400 font-light truncate">{profile?.email || ""}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 divide-x divide-gray-50 bg-gray-50/60">
                <div className="py-4 flex flex-col items-center gap-0.5">
                  <span className="text-sm font-semibold text-gray-800">{joinDate}</span>
                  <span className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Member since</span>
                </div>
                <div className="py-4 flex flex-col items-center gap-0.5">
                  {isVerified ? (
                    <>
                      <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-[10px] text-blue-500 font-medium uppercase tracking-widest">Verified</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-300">—</span>
                      <span className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
              <a href="/orders" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-600 font-light hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-50">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                My Orders
              </a>
              <a href="/cart" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-600 font-light hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-50">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                My Cart
              </a>
              <a href="/profile/partner" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-600 font-light hover:bg-gray-50 hover:text-gray-900 transition-colors border-b border-gray-50">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Partner Dashboard
              </a>
              <div className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-900 font-medium border-l-2 border-gray-900 bg-gray-50/80 border-b border-gray-50">
                <svg className="w-4 h-4 text-gray-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile & Addresses
              </div>
              <button className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-400 font-light hover:bg-red-50 hover:text-red-500 transition-colors w-full text-left">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>

          {/* ── RIGHT MAIN CONTENT ───────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Personal Information */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Personal Information</h2>
                  <p className="text-xs text-gray-400 font-light mt-0.5">Your name, email and contact details</p>
                </div>
                <div className="flex items-center gap-3">
                  {isEditingProfile ? (
                    <>
                      <button onClick={cancelEditProfile} className="text-xs text-gray-400 font-light hover:text-gray-700 transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={saveProfile}
                        disabled={savingProfile}
                        className="h-8 px-4 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-all disabled:opacity-50"
                      >
                        {savingProfile ? "Saving..." : "Save Changes"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="h-8 px-4 rounded-lg border border-gray-200 text-xs text-gray-600 font-light hover:border-gray-400 hover:text-gray-900 transition-all"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.full_name}
                        onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                        className={inputActiveClass}
                        placeholder="Enter full name"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-light py-2.5 border-b border-gray-100">
                        {profile?.full_name || <span className="text-gray-300 italic text-xs">Not provided</span>}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <p className="text-sm text-gray-800 font-light py-2.5 border-b border-gray-100 flex items-center gap-2">
                      {profile?.email || <span className="text-gray-300 italic text-xs">Loading...</span>}
                      <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-light">Cannot change</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className={inputActiveClass}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-sm text-gray-800 font-light py-2.5 border-b border-gray-100">
                        {profile?.phone || <span className="text-gray-300 italic text-xs">Not provided</span>}
                      </p>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Manage Addresses */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
              <button
                onClick={() => setIsAddressListOpen(!isAddressListOpen)}
                className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-gray-900">Manage Addresses</h2>
                  <span className="text-[10px] font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {addresses.length}
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isAddressListOpen ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className={`transition-all duration-300 ease-in-out ${isAddressListOpen ? "opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                <div className="px-6 py-5 space-y-4">

                  {/* Add Address Button */}
                  {!showAddAddress && (
                    <button
                      onClick={openNewAddressForm}
                      className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-200 rounded-lg py-3.5 text-xs text-gray-500 font-light hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New Address
                    </button>
                  )}

                  {/* Address Form */}
                  {showAddAddress && (
                    <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/40">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {editingAddressId ? "Edit Address" : "New Address"}
                        </h3>
                        <button onClick={closeAddressForm} className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      <form onSubmit={saveAddress} className="space-y-4">

                        {/* Country */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Country / Region</label>
                          <div className="relative">
                            <select
                              value={addressForm.country}
                              onChange={e => setAddressForm({ ...addressForm, country: e.target.value })}
                              className="w-full h-10 bg-white border border-gray-200 rounded px-3.5 text-sm text-gray-900 outline-none focus:border-gray-400 transition-all font-light appearance-none cursor-pointer"
                            >
                              <option value="India">India</option>
                              <option value="United States">United States</option>
                              <option value="United Kingdom">United Kingdom</option>
                              <option value="Canada">Canada</option>
                              <option value="Australia">Australia</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>

                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">First Name</label>
                            <input required value={addressForm.first_name} onChange={e => setAddressForm({ ...addressForm, first_name: e.target.value })} className={inputClass} placeholder="First name" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Last Name</label>
                            <input value={addressForm.last_name} onChange={e => setAddressForm({ ...addressForm, last_name: e.target.value })} className={inputClass} placeholder="Last name" />
                          </div>
                        </div>

                        {/* Address line 1 */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Address</label>
                          <div className="relative">
                            <input
                              required
                              value={addressForm.address_line1}
                              onChange={e => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                              className={`${inputClass} pr-24`}
                              placeholder="Street address"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <LocationPicker
                                onSelect={(loc) => setAddressForm(prev => ({
                                  ...prev,
                                  city: loc.city || prev.city,
                                  state: loc.state || prev.state,
                                  pincode: loc.pincode || prev.pincode,
                                  district: loc.district || prev.district
                                }))}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address line 2 */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Apt, Suite, etc. <span className="normal-case font-light">(optional)</span></label>
                          <input value={addressForm.address_line2} onChange={e => setAddressForm({ ...addressForm, address_line2: e.target.value })} className={inputClass} placeholder="Apartment, suite, etc." />
                        </div>

                        {/* City / State / PIN */}
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">City</label>
                            <input required value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} className={inputClass} placeholder="City" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">State</label>
                            <input required value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} className={inputClass} placeholder="State" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">PIN Code</label>
                            <input required value={addressForm.pincode} onChange={e => setAddressForm({ ...addressForm, pincode: e.target.value })} className={inputClass} placeholder="PIN" />
                          </div>
                        </div>

                        {/* Phone */}
                        <div>
                          <label className="block text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1.5">Phone</label>
                          <div className="flex">
                            <div className="flex items-center gap-2 px-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l text-sm text-gray-600 font-light whitespace-nowrap">
                              <svg width="18" height="13" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" className="border border-gray-200 rounded-sm flex-shrink-0">
                                <rect width="300" height="66.66" fill="#FF9933"/>
                                <rect y="66.66" width="300" height="66.66" fill="#FFFFFF"/>
                                <rect y="133.33" width="300" height="66.66" fill="#138808"/>
                                <circle cx="150" cy="100" r="18" fill="#000080" />
                                <circle cx="150" cy="100" r="13" fill="#FFF" />
                                <circle cx="150" cy="100" r="10" fill="#000080" />
                              </svg>
                              +91
                            </div>
                            <input
                              required
                              value={addressForm.phone}
                              onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })}
                              className="flex-1 bg-white border border-gray-200 rounded-r px-3.5 py-2.5 text-sm text-gray-900 font-light outline-none focus:border-gray-400 transition-all"
                              placeholder="Mobile number"
                            />
                          </div>
                        </div>

                        {/* Default checkbox */}
                        <label className="flex items-center gap-2.5 cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={addressForm.set_default}
                            onChange={(e) => setAddressForm({ ...addressForm, set_default: e.target.checked })}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-400 cursor-pointer"
                          />
                          <span className="text-xs text-gray-600 font-light">Set as default address</span>
                        </label>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
                          <button type="button" onClick={closeAddressForm} className="h-9 px-4 text-xs text-gray-500 font-light hover:text-gray-900 transition-colors">
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingAddress}
                            className="h-9 px-6 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-all disabled:opacity-50"
                          >
                            {savingAddress ? "Saving..." : "Save Address"}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Address List */}
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2].map(i => (
                        <div key={i} className="h-24 rounded-xl shimmer-line" />
                      ))}
                    </div>
                  ) : addresses.length === 0 && !showAddAddress ? (
                    <div className="py-10 text-center border border-dashed border-gray-100 rounded-xl">
                      <svg className="w-8 h-8 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-sm text-gray-400 font-light">No saved addresses</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`relative p-5 rounded-xl border transition-all ${
                            addr.is_default
                              ? "border-gray-900 bg-gray-50/80"
                              : "border-gray-100 bg-white hover:border-gray-200"
                          }`}
                        >
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              {addr.is_default && (
                                <span className="text-[10px] font-medium text-gray-900 border border-gray-300 px-2 py-0.5 rounded uppercase tracking-widest">
                                  Default
                                </span>
                              )}
                              <span className="text-sm font-semibold text-gray-900">{addr.full_name}</span>
                              <span className="text-xs text-gray-400 font-light">+91 {addr.phone}</span>
                            </div>

                            <div className="flex items-center gap-3 flex-shrink-0">
                              {!addr.is_default && (
                                <button
                                  onClick={() => setDefault(addr.id)}
                                  className="text-[10px] text-gray-500 font-light hover:text-gray-900 underline underline-offset-2 transition-colors hidden sm:block"
                                >
                                  Set default
                                </button>
                              )}
                              <button
                                onClick={() => handleEditAddress(addr)}
                                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteAddress(addr.id)}
                                className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Address text */}
                          <p className="mt-2 text-xs text-gray-500 font-light leading-relaxed">
                            {addr.address_line1}
                            {addr.address_line2 && `, ${addr.address_line2}`}
                            <br />
                            {addr.city}{addr.district && `, ${addr.district}`}, {addr.state} — {addr.pincode}
                            <br />
                            {addr.country || "India"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}