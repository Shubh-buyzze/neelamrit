// app/admin/inventory/page.tsx
"use client";

import React, { useEffect, useState } from "react";

type InventoryItem = {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  products: { id: string; name: string; price: number };
};

const LOG_COLORS: Record<string, { bg: string; color: string }> = {
  restock:       { bg: "bg-emerald-100", color: "text-emerald-800" },
  sale:          { bg: "bg-blue-100", color: "text-blue-800" },
  cancelled:     { bg: "bg-amber-100", color: "text-amber-800" },
  manual_adjust: { bg: "bg-purple-100", color: "text-purple-800" },
  damaged:       { bg: "bg-red-100", color: "text-red-800" },
};

// ----- SVGs -----
const PackageIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M12 2v10" />
    <path d="M4 6h16" />
    <path d="M12 12l6-6" />
    <path d="M12 12l-6-6" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const HistoryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H5.78a1.65 1.65 0 0 0-1.51 1 1.65 1.65 0 0 0 .33 1.82l.06.1a10 10 0 0 0 14.74 0l.06-.1z" />
  </svg>
);

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ lowStockCount: 0, outOfStockCount: 0 });
  const [activeTab, setActiveTab] = useState<"stock" | "logs">("stock");
  const [filterStatus, setFilterStatus] = useState("all");

  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [operation, setOperation] = useState<"add" | "subtract" | "set">("add");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [changeType, setChangeType] = useState("restock");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
    fetchLogs();
  }, []);

  async function fetchInventory() {
    const res = await fetch("/api/admin/inventory");
    if (res.ok) {
      const json = await res.json();
      setInventory(json.data ?? []);
      setSummary(json.summary ?? { lowStockCount: 0, outOfStockCount: 0 });
    }
    setLoading(false);
  }

  async function fetchLogs() {
    const res = await fetch("/api/admin/inventory/logs");
    if (res.ok) {
      const json = await res.json();
      setLogs(json.data ?? []);
    }
  }

  function openForm(id: string) {
    if (activeItemId === id) {
      setActiveItemId(null);
      return;
    }
    setActiveItemId(id);
    setOperation("add");
    setQty("");
    setNote("");
    setChangeType("restock");
  }

  async function handleSave(item: InventoryItem) {
    if (!qty || Number(qty) <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    setSaving(true);

    const res = await fetch(`/api/admin/inventory/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity: Number(qty),
        operation,
        change_type: changeType,
        note: note || undefined,
      }),
    });

    const result = await res.json();
    setSaving(false);

    if (result.success) {
      const newQty = result.data.quantity;
      setInventory((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                quantity: newQty,
                is_low_stock: newQty <= i.low_stock_threshold && newQty > 0,
                is_out_of_stock: newQty === 0,
              }
            : i
        )
      );
      setActiveItemId(null);
      setQty("");
      setNote("");
      fetchLogs();
      fetchInventory();
    } else {
      alert("Error: " + result.error);
    }
  }

  const filtered =
    filterStatus === "all"
      ? inventory
      : filterStatus === "low"
      ? inventory.filter((i) => i.is_low_stock && !i.is_out_of_stock)
      : inventory.filter((i) => i.is_out_of_stock);

  const OPERATIONS = [
    { key: "add",      label: "+ Add Stock",      activeClass: "bg-emerald-100 text-emerald-700 border-emerald-500" },
    { key: "subtract", label: "− Remove Stock",   activeClass: "bg-red-100 text-red-700 border-red-500" },
    { key: "set",      label: "= Set Stock",      activeClass: "bg-blue-100 text-blue-700 border-blue-500" },
  ];

  const CHANGE_TYPES: Record<string, string[]> = {
    add:      ["restock", "manual_adjust"],
    subtract: ["damaged", "manual_adjust", "sale"],
    set:      ["manual_adjust"],
  };

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-500 text-sm mt-1">Track stock levels and manage warehouse inventory.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm font-bold text-gray-500 uppercase mb-2">Total Products</p>
          <p className="text-4xl font-extrabold text-gray-900">{inventory.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 rounded-l-2xl" />
          <p className="text-sm font-bold text-amber-700 uppercase mb-2 flex items-center gap-1">
            <AlertIcon /> Low Stock
          </p>
          <p className="text-4xl font-extrabold text-amber-600">{summary.lowStockCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm relative">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 rounded-l-2xl" />
          <p className="text-sm font-bold text-red-700 uppercase mb-2 flex items-center gap-1">
            <AlertIcon /> Out of Stock
          </p>
          <p className="text-4xl font-extrabold text-red-600">{summary.outOfStockCount || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 pb-4">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "stock" ? "bg-gray-900 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <PackageIcon /> Stock Management
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
            activeTab === "logs" ? "bg-gray-900 text-white shadow-md" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          <HistoryIcon /> Change Logs
        </button>
      </div>

      {/* Stock Tab */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                filterStatus === "all" ? "bg-amber-800 text-white border-amber-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All ({inventory.length})
            </button>
            <button
              onClick={() => setFilterStatus("low")}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                filterStatus === "low" ? "bg-amber-800 text-white border-amber-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Low Stock ({summary.lowStockCount})
            </button>
            <button
              onClick={() => setFilterStatus("out")}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition ${
                filterStatus === "out" ? "bg-amber-800 text-white border-amber-800" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              Out of Stock ({summary.outOfStockCount})
            </button>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-20 bg-gray-200 rounded-xl w-full" />
              <div className="h-20 bg-gray-200 rounded-xl w-full" />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Current Stock</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td colSpan={4} className="p-0">
                          <div className="grid grid-cols-4 items-center px-6 py-5">
                            <div>
                              <p className="font-semibold text-gray-900">{item.products?.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">₹{item.products?.price}</p>
                            </div>
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-2xl font-bold ${
                                  item.is_out_of_stock ? "text-red-600" : item.is_low_stock ? "text-amber-600" : "text-emerald-600"
                                }`}>
                                  {item.quantity}
                                </span>
                                <span className="text-xs text-gray-400">units</span>
                              </div>
                              <p className="text-[10px] text-gray-400 uppercase mt-1">Alert at {item.low_stock_threshold}</p>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                                item.is_out_of_stock ? "bg-red-100 text-red-700" :
                                item.is_low_stock ? "bg-amber-100 text-amber-700" :
                                "bg-emerald-100 text-emerald-700"
                              }`}>
                                {item.is_out_of_stock ? "Out of Stock" : item.is_low_stock ? "Low Stock" : "In Stock"}
                              </span>
                            </div>
                            <div className="text-right">
                              <button
                                onClick={() => openForm(item.id)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                                  activeItemId === item.id
                                    ? "bg-gray-900 text-white shadow-md"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                                }`}
                              >
                                <SettingsIcon />
                                {activeItemId === item.id ? "Close" : "Manage Stock"}
                              </button>
                            </div>
                          </div>
                          {activeItemId === item.id && (
                            <div className="mx-6 mb-6 mt-2 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                              <div className="flex items-center gap-2 mb-5">
                                <SettingsIcon />
                                <h3 className="font-bold text-gray-900 text-base">Adjust Inventory</h3>
                              </div>
                              <div className="flex flex-wrap gap-3 mb-6">
                                {OPERATIONS.map((op) => (
                                  <button
                                    key={op.key}
                                    onClick={() => {
                                      setOperation(op.key as any);
                                      setChangeType(CHANGE_TYPES[op.key][0]);
                                    }}
                                    className={`px-5 py-2 rounded-lg text-sm font-bold border transition-all ${
                                      operation === op.key
                                        ? op.activeClass
                                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-100"
                                    }`}
                                  >
                                    {op.label}
                                  </button>
                                ))}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Quantity *</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={qty}
                                    onChange={(e) => setQty(e.target.value)}
                                    placeholder="Enter quantity"
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Reason</label>
                                  <select
                                    value={changeType}
                                    onChange={(e) => setChangeType(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 outline-none text-sm capitalize"
                                  >
                                    {CHANGE_TYPES[operation].map((ct) => (
                                      <option key={ct} value={ct}>{ct.replace("_", " ")}</option>
                                    ))}
                                  </select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Optional Note</label>
                                  <div className="flex gap-3">
                                    <input
                                      value={note}
                                      onChange={(e) => setNote(e.target.value)}
                                      placeholder="e.g., Damaged during transit, Supplier restock..."
                                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 outline-none text-sm"
                                    />
                                    <button
                                      onClick={() => handleSave(item)}
                                      disabled={saving || !qty}
                                      className={`px-6 py-2.5 rounded-lg text-sm font-bold text-white transition-all whitespace-nowrap ${
                                        saving || !qty ? "bg-emerald-300 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 shadow-md"
                                      }`}
                                    >
                                      {saving ? "Saving..." : "Confirm Update"}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-12 text-center text-gray-400">
                  <PackageIcon />
                  <p className="text-sm font-medium mt-2">No items match your filter.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Time</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Product</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Change</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-gray-400">
                    <HistoryIcon />
                    <p className="mt-2">No logs recorded yet.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const style = LOG_COLORS[log.change_type] ?? LOG_COLORS.manual_adjust;
                  const isPositive = log.quantity_change > 0;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-xs">
                        <div className="font-medium text-gray-700">
                          {new Date(log.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(log.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-sm text-gray-900">{log.products?.name}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${style.bg} ${style.color}`}>
                          {log.change_type.replace("_", " ")}
                        </span>
                       </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">{log.quantity_before}</span>
                          <span className={`text-xs font-bold ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
                            {isPositive ? `+${log.quantity_change}` : log.quantity_change}
                          </span>
                          <span className="text-xs text-gray-500">→</span>
                          <span className="text-xs font-semibold text-gray-800">{log.quantity_after}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                        {log.note || <span className="text-gray-300 italic">—</span>}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}