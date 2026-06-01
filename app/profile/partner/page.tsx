"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export const dynamic = 'force-dynamic'

export default function PartnerDashboardPage() {
  const [step, setStep] = useState<
    "loading" | "intro" | "form" | "dashboard"
  >("loading");

  const [loading, setLoading] = useState(false);
  const [partnerData, setPartnerData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    payout_method: "upi",
    upi_id: "",
    bank_account: "",
    bank_ifsc: "",
  });

  useEffect(() => {
    checkPartnerStatus();
  }, []);

  async function checkPartnerStatus() {
    try {
      const res = await fetch("/api/partner/status");
      const json = await res.json();

      if (json.isPartner) {
        setPartnerData(json.data);
        await fetchPartnerOrders();
        setStep("dashboard");
      } else {
        const profileRes = await fetch("/api/auth/me");
        const profileJson = await profileRes.json();
        setProfileData(profileJson.data);
        setFormData((prev) => ({
          ...prev,
          name: profileJson.data?.full_name || "",
          email: profileJson.data?.email || "",
          phone: profileJson.data?.phone || "",
        }));
        setStep("intro");
      }

      try {
        const profileRes = await fetch("/api/auth/me");
        const profileJson = await profileRes.json();
        setProfileData(profileJson.data);
      } catch {}
    } catch (err) {
      setStep("intro");
    }
  }

  async function fetchPartnerOrders() {
    try {
      const res = await fetch("/api/partner/orders");
      const json = await res.json();
      if (json.success) setOrders(json.data);
    } catch (err) {
      console.error("Failed to fetch orders");
    }
  }

  async function handleRegisterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/partner/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        setPartnerData(json.data);
        await fetchPartnerOrders();
        setStep("dashboard");
      } else {
        alert(json.error || "Registration failed");
      }
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdrawTrigger() {
    try {
      const res = await fetch("/api/partner/withdraw", { method: "POST" });
      const json = await res.json();
      alert(json.success ? json.message : json.error);
    } catch {
      alert("Withdraw request failed");
    }
  }

  function copyToClipboard() {
    if (partnerData?.promo_code) {
      navigator.clipboard.writeText(partnerData.promo_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const successDeliveries = orders.filter((o) => o.status === "delivered");
  const cancelledOrders = orders.filter((o) => o.status === "cancelled");
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const totalEarnings = successDeliveries.length * 15;
  const canWithdraw = totalEarnings >= 500;

  // Build monthly chart data
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const now = new Date();
  const last6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: months[d.getMonth()], month: d.getMonth(), year: d.getFullYear() };
  });

  const salesByMonth = last6.map(({ month, year }) =>
    orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length
  );

  const earningsByMonth = last6.map(({ month, year }) =>
    orders.filter((o) => {
      const d = new Date(o.created_at);
      return d.getMonth() === month && d.getFullYear() === year && o.status === "delivered";
    }).length * 15
  );

  const maxSales = Math.max(...salesByMonth, 1);
  const maxEarnings = Math.max(...earningsByMonth, 1);

  function makePath(data: number[], max: number, w: number, h: number): string {
    if (data.length < 2) return "";
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * h * 0.85 - h * 0.05;
      return [x, y] as [number, number];
    });
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
      d += ` C ${cpx} ${pts[i - 1][1]} ${cpx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
    }
    return d;
  }

  function makeAreaPath(data: number[], max: number, w: number, h: number): string {
    const line = makePath(data, max, w, h);
    if (!line) return "";
    return `${line} L ${w} ${h} L 0 ${h} Z`;
  }

  // ── LOADING ──────────────────────────────────────────────
  if (step === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase font-light">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  const displayName = profileData?.full_name || partnerData?.name || "Partner";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800" style={{ fontFamily: "'Inter','Helvetica Neue',sans-serif" }}>
      <div className="flex">

        {/* ── SIDEBAR ──────────────────────────────────── */}
        <aside className="hidden lg:flex w-64 min-h-screen border-r border-gray-100 bg-white flex-col justify-between py-8 px-5 sticky top-0 h-screen overflow-y-auto">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-3 mb-10 px-1">
              {/* Logo — white background container, place /public/logo.png */}
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Image
                  src="/favicon.webp"
                  alt="Neelamrit Logo"
                  width={48}
                  height={48}
                  className="object-contain w-full h-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg leading-none tracking-tight">Neelamrit</p>
                <p className="text-gray-500 text-[11px] mt-0.5 font-light tracking-widest uppercase">Partner</p>
              </div>
            </div>

            {/* Only Dashboard */}
            <nav>
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white bg-gray-900 shadow-sm text-left">
                <svg className="w-4 h-4 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
            </nav>
          </div>

          {/* Profile at bottom */}
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-all group"
          >
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 text-sm font-semibold flex-shrink-0 overflow-hidden">
              {profileData?.avatar ? (
                <Image src={profileData.avatar} alt={displayName} width={36} height={36} className="object-cover w-full h-full" />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-gray-900 transition-colors">
                {displayName}
              </p>
              <p className="text-xs text-gray-400 font-light truncate">
                {profileData?.email || "Partner"}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0 group-hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </aside>

        {/* ── MAIN ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0">

          {/* Top Bar */}
          <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-700 transition-all text-sm lg:hidden"
              >
                ←
              </Link>
              <div>
                <h1 className="text-base font-semibold text-gray-900 leading-none">
                  {step === "dashboard"
                    ? `Welcome, ${displayName.split(" ")[0]}`
                    : "Partner Dashboard"}
                </h1>
                <p className="text-xs text-gray-400 font-light mt-0.5">
                  Track your referrals and earnings in real-time.
                </p>
              </div>
            </div>

            {step === "dashboard" && partnerData && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-light hidden sm:block">Referral Code</span>
                <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50">
                  <span className="text-sm font-semibold tracking-widest text-gray-800">
                    {partnerData.promo_code}
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="text-gray-400 hover:text-gray-900 transition-colors text-xs"
                  >
                    {copied ? "✓" : "⧉"}
                  </button>
                </div>
                <button className="h-8 px-4 rounded-lg bg-gray-900 text-white text-xs font-medium hover:bg-gray-700 transition-all">
                  Share Code
                </button>
              </div>
            )}
          </div>

          <div className="p-4 md:p-8">

            {/* ── INTRO ──────────────────────────────────── */}
            {step === "intro" && (
              <div className="max-w-2xl mx-auto mt-12">
                <div className="bg-white border border-gray-100 rounded-2xl p-10 md:p-14 text-center shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mx-auto text-white text-xl font-light mb-8">
                    ₹
                  </div>
                  <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-3 leading-tight">
                    Earn With Your Network
                  </h2>
                  <p className="text-gray-400 font-light leading-relaxed mb-8 max-w-md mx-auto text-sm">
                    Share your referral code and earn commission on every successful order placed through your network.
                  </p>
                  <button
                    onClick={() => setStep("form")}
                    className="h-11 px-8 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-all"
                  >
                    Become a Partner
                  </button>
                </div>
              </div>
            )}

            {/* ── FORM ────────────────────────────────────── */}
            {step === "form" && (
              <div className="max-w-2xl mx-auto mt-8">
                <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Setup Partner Profile</h2>
                  <p className="text-sm text-gray-400 font-light mb-8">Fill in your details to get started.</p>

                  <form onSubmit={handleRegisterSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Full Name</label>
                        <input
                          required type="text" value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm outline-none focus:border-gray-900 focus:bg-white transition-all font-light"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Phone Number</label>
                        <input
                          required type="text" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm outline-none focus:border-gray-900 focus:bg-white transition-all font-light"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">Email</label>
                      <input
                        disabled type="email" value={formData.email}
                        className="w-full h-11 bg-gray-50 border border-gray-100 rounded-lg px-4 text-sm text-gray-400 font-light cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-400 mb-2 uppercase tracking-wide">UPI ID</label>
                      <input
                        required type="text" value={formData.upi_id}
                        onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                        placeholder="yourupi@okaxis"
                        className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-4 text-sm outline-none focus:border-gray-900 focus:bg-white transition-all font-light"
                      />
                    </div>
                    <button
                      type="submit" disabled={loading}
                      className="w-full h-11 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-all disabled:opacity-50"
                    >
                      {loading ? "Generating..." : "Generate Referral Code"}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* ── DASHBOARD ──────────────────────────────── */}
            {step === "dashboard" && partnerData && (
              <div className="space-y-5">

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  {[
                    { title: "Total Referrals",   value: orders.length,             iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" },
                    { title: "Pending / Transit", value: pendingOrders.length,      iconPath: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { title: "Delivered",         value: successDeliveries.length,  iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
                    { title: "Cancelled",         value: cancelledOrders.length,    iconPath: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400 font-light">{item.title}</p>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.iconPath} />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-semibold text-gray-900 mb-1.5">{item.value}</h3>
                      <p className="text-[10px] text-gray-300 font-light underline underline-offset-2 cursor-pointer hover:text-gray-600 transition-colors uppercase tracking-wide">
                        View details
                      </p>
                    </div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid md:grid-cols-2 gap-4">

                  {/* Sales Chart — blue */}
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Sales (Orders)</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-0.5">
                          {orders.length}
                          <span className="text-sm text-gray-400 font-light ml-1">total</span>
                        </p>
                      </div>
                      <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium uppercase tracking-wide">
                        6 months
                      </span>
                    </div>
                    <svg viewBox="0 0 320 100" className="w-full h-28" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2563eb" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#2563eb" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={makeAreaPath(salesByMonth, maxSales, 320, 100)} fill="url(#salesGrad)" />
                      <path d={makePath(salesByMonth, maxSales, 320, 100)} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {salesByMonth.map((v, i) => {
                        const x = (i / (salesByMonth.length - 1)) * 320;
                        const y = 100 - (v / maxSales) * 100 * 0.85 - 100 * 0.05;
                        return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#2563eb" strokeWidth="1.5" />;
                      })}
                    </svg>
                    <div className="flex justify-between mt-1">
                      {last6.map((m, i) => (
                        <span key={i} className="text-[10px] text-gray-300 font-light">{m.label}</span>
                      ))}
                    </div>
                  </div>

                  {/* Earnings Chart — yellow/amber */}
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest">Earnings</p>
                        <p className="text-2xl font-semibold text-gray-900 mt-0.5">
                          ₹{totalEarnings}
                          <span className="text-sm text-gray-400 font-light ml-1">total</span>
                        </p>
                      </div>
                      <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full font-medium uppercase tracking-wide">
                        6 months
                      </span>
                    </div>
                    <svg viewBox="0 0 320 100" className="w-full h-28" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ca8a04" stopOpacity="0.15" />
                          <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={makeAreaPath(earningsByMonth, maxEarnings, 320, 100)} fill="url(#earnGrad)" />
                      <path d={makePath(earningsByMonth, maxEarnings, 320, 100)} fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      {earningsByMonth.map((v, i) => {
                        const x = (i / (earningsByMonth.length - 1)) * 320;
                        const y = 100 - (v / maxEarnings) * 100 * 0.85 - 100 * 0.05;
                        return <circle key={i} cx={x} cy={y} r="3" fill="white" stroke="#ca8a04" strokeWidth="1.5" />;
                      })}
                    </svg>
                    <div className="flex justify-between mt-1">
                      {last6.map((m, i) => (
                        <span key={i} className="text-[10px] text-gray-300 font-light">{m.label}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Earnings + Progress */}
                <div className="grid md:grid-cols-2 gap-4">

                  {/* Total Earnings */}
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Total Earnings</p>
                    <h2 className="text-4xl font-semibold text-gray-900 mb-1">₹{totalEarnings}</h2>
                    <p className="text-xs text-gray-400 font-light mb-5">All time earnings</p>

                    <button
                      disabled={!canWithdraw}
                      onClick={handleWithdrawTrigger}
                      className={`h-9 px-5 rounded-lg text-sm font-medium transition-all ${
                        canWithdraw
                          ? "bg-gray-900 text-white hover:bg-gray-700"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Withdraw Funds
                    </button>
                    <p className="text-xs text-gray-400 font-light mt-2">Minimum withdraw: ₹500</p>
                  </div>

                  {/* Earnings Progress */}
                  <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
                    <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-4">Earnings Progress</p>

                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-700 font-light">
                        ₹{totalEarnings}
                        <span className="text-gray-400"> / ₹500</span>
                      </span>
                      <span className="text-sm font-semibold text-gray-900">
                        {Math.min(Math.round((totalEarnings / 500) * 100), 100)}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden mb-3">
                      <div
                        className="h-full bg-gray-900 rounded-full transition-all duration-700"
                        style={{ width: `${Math.min((totalEarnings / 500) * 100, 100)}%` }}
                      />
                    </div>

                    <p className="text-xs text-gray-400 font-light">
                      ₹{Math.max(500 - totalEarnings, 0)} more to withdraw
                    </p>

                    <div className="mt-5 pt-5 border-t border-gray-50">
                      <p className="text-[10px] text-gray-400 font-light uppercase tracking-widest mb-1">Payout destination</p>
                      <p className="text-sm text-gray-700 font-light">
                        {partnerData.payout_method === "upi" ? partnerData.upi_id : partnerData.bank_account}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Referrals */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.05)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-900">Recent Referrals</h2>
                    <button className="text-xs text-gray-400 font-light hover:text-gray-900 transition-colors">
                      View All
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {orders.length === 0 ? (
                      <div className="py-14 text-center">
                        <p className="text-sm text-gray-400 font-light">No referral orders found.</p>
                      </div>
                    ) : (
                      orders.map((order, idx) => (
                        <div
                          key={order.id || idx}
                          className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/60 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 text-xs flex-shrink-0">
                              #
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-800">
                                Order #{order.id?.substring(0, 8)}
                              </p>
                              <p className="text-xs text-gray-400 font-light mt-0.5">
                                {new Date(order.created_at).toLocaleDateString("en-IN", {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className={`text-xs px-2.5 py-1 rounded-md font-medium ${
                              order.status === "delivered"
                                ? "bg-green-50 text-green-600"
                                : order.status === "pending"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-500"
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                            <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                              {order.status === "delivered" ? "+₹15" : "—"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}