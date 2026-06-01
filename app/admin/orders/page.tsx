"use client";

import { useEffect, useState } from "react";

export const dynamic = 'force-dynamic'

type OrderItem = {
  id: string;
  quantity: number;
  unit_price: number;
  products: { name: string; price: number };
};

type Order = {
  id: string;
  status: string;
  total_amount: number;
  cancellation_reason?: string;
  shipping_address: any;
  created_at: string;
  users_profile: { full_name: string; phone: string };
  order_items: OrderItem[];
};

const STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancellation_requested",
  "cancelled",
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  confirmed: "bg-blue-50 text-blue-700",
  processing: "bg-indigo-50 text-indigo-700",
  shipped: "bg-emerald-50 text-emerald-700",
  delivered: "bg-teal-50 text-teal-700",
  cancellation_requested: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
};

// ---------- Professional SVG Icons (neutral, no emojis) ----------
const AlertIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M12 2v10" />
    <path d="M4 6h16" />
    <path d="M12 12l6-6" />
    <path d="M12 12l-6-6" />
  </svg>
);

const UserIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MapPinIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const CheckCircleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const LoaderIcon = () => (
  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" />
    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeLinecap="round" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState(""); // 🟢 NEW: Search Query State
  
  const [approving, setApproving] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const json = await res.json();
        setOrders(json.data ?? []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await res.json();
      if (result.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      } else {
        alert("Error: " + (result.error || "Update failed"));
      }
    } finally {
      setUpdating(null);
    }
  }

  async function approveCancellation(orderId: string) {
    if (!confirm("Approve cancellation? This will restore stock automatically.")) return;
    setApproving(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/approve-cancel`, { method: "POST" });
      const result = await res.json();
      if (result.success) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)));
      } else {
        alert("Error: " + result.error);
      }
    } finally {
      setApproving(null);
    }
  }

  // 🟢 SMART FILTERING LOGIC
  let filtered = orders;

  if (searchQuery.trim() !== "") {
    // Agar search ho raha hai, toh saare orders (cancelled bhi) me ID search karo
    const query = searchQuery.trim().toLowerCase();
    filtered = filtered.filter((o) => o.id.toLowerCase().includes(query));
    
    // Agar status filter bhi laga hai, toh usko apply karo
    if (filterStatus !== "all") {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }
  } else {
    // Normal filtering (Bina search ke)
    if (filterStatus === "all") {
      // All me cancelled orders nahi dikhenge
      filtered = filtered.filter((o) => o.status !== "cancelled");
    } else {
      filtered = filtered.filter((o) => o.status === filterStatus);
    }
  }

  const reqCount = orders.filter((o) => o.status === "cancellation_requested").length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const cancelledCount = orders.filter((o) => o.status === "cancelled").length;
  const activeCount = orders.filter((o) => o.status !== "cancelled").length; // All active count

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 text-sm mt-1">Monitor orders, process shipments, and handle cancellations.</p>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setFilterStatus(filterStatus === "cancellation_requested" ? "all" : "cancellation_requested")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === "cancellation_requested"
                ? "bg-amber-100 text-amber-800 ring-2 ring-amber-300"
                : reqCount > 0
                ? "bg-white border border-amber-300 text-amber-700 hover:bg-amber-50"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <AlertIcon />
            <span>Cancel Requests ({reqCount})</span>
          </button>

          <button
            onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === "pending"
                ? "bg-gray-100 text-gray-800 ring-2 ring-gray-400"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <ClockIcon />
            <span>Pending ({pendingCount})</span>
          </button>

          {/* 🟢 NEW: Cancelled Filter Button */}
          <button
            onClick={() => setFilterStatus(filterStatus === "cancelled" ? "all" : "cancelled")}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === "cancelled"
                ? "bg-red-100 text-red-800 ring-2 ring-red-300"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${filterStatus === "cancelled" ? "bg-red-600" : "bg-red-400"}`}></span>
            <span>Cancelled ({cancelledCount})</span>
          </button>
        </div>

        {/* Controls Bar: Status Filter Dropdown + Search Box */}
        <div className="mb-6 bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-600">Show:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:w-auto bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-1 focus:ring-gray-400 outline-none p-2 font-medium cursor-pointer"
            >
              <option value="all">Active Orders ({activeCount})</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* 🟢 NEW: Search Box */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search by Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:bg-white transition-all placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 md:p-16 text-center">
              <PackageIcon />
              <p className="text-gray-500 font-medium mt-2">
                {searchQuery ? "No orders found matching this ID." : "No orders found in this category."}
              </p>
            </div>
          ) : (
            filtered.map((order) => {
              const statusClass = STATUS_COLORS[order.status] ?? STATUS_COLORS.pending;
              const isExpanded = expandedId === order.id;
              const isReq = order.status === "cancellation_requested";
              const isCancelled = order.status === "cancelled";

              return (
                <div
                  key={order.id}
                  className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isExpanded ? "shadow-md" : "shadow-sm hover:border-gray-300"
                  } ${isReq ? "border-amber-300 ring-1 ring-amber-200" : isCancelled ? "border-red-200 bg-red-50/20" : "border-gray-200"}`}
                >
                  {/* Main Row */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative">
                    {isCancelled && <div className="absolute top-0 left-0 w-1 h-full bg-red-500 rounded-l-2xl" />}
                    {isReq && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 animate-pulse rounded-l-2xl" />}

                    {/* Order Info (clickable) */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="cursor-pointer flex-1 pl-2 w-full"
                    >
                      <p className={`font-bold text-base md:text-lg transition-colors break-all ${
                        isCancelled ? "text-red-600 line-through" : "text-gray-900 hover:text-amber-700"
                      }`}>
                        #{order.id.toUpperCase()}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="text-xs md:text-sm">
                          {new Date(order.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full" />
                        <span className="font-bold text-gray-900">₹{Number(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${statusClass}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>

                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        disabled={updating === order.id || isReq || isCancelled}
                        className="bg-gray-50 border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-1 focus:ring-gray-400 outline-none p-2 font-medium disabled:opacity-50 cursor-pointer"
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, " ").toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-5 md:p-6 animate-in fade-in duration-200">
                      {/* Cancellation Approval Banner */}
                      {isReq && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 p-4 md:p-5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4 shadow-sm">
                          <div className="flex-1">
                            <p className="font-bold text-amber-800 flex items-center gap-2">
                              <AlertIcon /> Customer requested cancellation
                            </p>
                            <div className="mt-2 bg-white p-3 rounded-lg border border-amber-200 text-sm text-amber-800">
                              <strong>Reason:</strong> {order.cancellation_reason || "No reason specified."}
                            </div>
                          </div>
                          <button
                            onClick={() => approveCancellation(order.id)}
                            disabled={approving === order.id}
                            className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-amber-700 transition-all shadow-sm whitespace-nowrap disabled:opacity-70 flex items-center justify-center gap-2"
                          >
                            {approving === order.id ? <LoaderIcon /> : <CheckCircleIcon />}
                            {approving === order.id ? "Processing..." : "Approve & Restore Stock"}
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Items Ordered */}
                        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                            <PackageIcon />
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Items Ordered</p>
                          </div>
                          <div className="space-y-3">
                            {order.order_items?.map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded flex items-center justify-center text-xs font-bold">
                                    {item.quantity}x
                                  </span>
                                  <span className="font-medium text-gray-800">{item.products?.name}</span>
                                </div>
                                <span className="font-semibold text-gray-900">
                                  ₹{(item.unit_price * item.quantity).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer & Shipping Details */}
                        <div className="space-y-6">
                          {/* Customer */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                              <UserIcon />
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</p>
                            </div>
                            <p className="font-semibold text-gray-900 mb-1">{order.users_profile?.full_name || "N/A"}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <PhoneIcon />
                              <span>{order.users_profile?.phone || "N/A"}</span>
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                              <MapPinIcon />
                              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Shipping Address</p>
                            </div>
                            {order.shipping_address ? (
                              <div className="text-sm text-gray-700 space-y-1">
                                <p className="font-semibold text-gray-900">{order.shipping_address.full_name}</p>
                                <div className="flex items-center gap-2">
                                  <PhoneIcon />
                                  <span>{order.shipping_address.phone}</span>
                                </div>
                                <p className="mt-2 leading-relaxed">
                                  {order.shipping_address.address_line1}
                                  <br />
                                  {order.shipping_address.city}, {order.shipping_address.state} –{" "}
                                  <span className="font-medium text-gray-800">{order.shipping_address.pincode}</span>
                                </p>
                              </div>
                            ) : (
                              <p className="text-gray-400 text-sm italic">No address provided.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}