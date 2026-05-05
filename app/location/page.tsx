// app/location/page.tsx (या जहाँ भी आपका यह राउट है)
"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import LocationBox, { Location } from "@/components/LocationBox";

export default function LocationPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState<Location | null>(null);

  const [form, setForm] = useState({
    full_name: "", phone: "",
    address_line1: "", address_line2: "",
    city: "", state: "Uttar Pradesh", pincode: "",
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  async function fetchAddresses() {
    const res = await fetch("/api/addresses");
    if (res.ok) {
      const json = await res.json();
      setAddresses(json.data ?? []);
      const def = json.data?.find((a: any) => a.is_default);
      if (def) setActiveId(def.id);
    }
    setLoading(false);
  }

  async function saveAddress() {
    if (!form.full_name || !form.phone || !form.address_line1 || !form.city || !form.pincode) {
      alert("Please fill all required fields");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const result = await res.json();
    setSaving(false);
    if (result.success) {
      setAddresses((prev) => [result.data, ...prev]);
      setShowAddForm(false);
      setForm({ full_name: "", phone: "", address_line1: "", address_line2: "", city: "", state: "Uttar Pradesh", pincode: "" });
    } else {
      alert("Error: " + result.error);
    }
  }

  async function setDefault(id: string) {
    await fetch(`/api/addresses/${id}`, { method: "PATCH" });
    setActiveId(id);
    setAddresses((prev) => prev.map((a) => ({ ...a, is_default: a.id === id })));
  }

  async function deleteAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    await fetch(`/api/addresses/${id}`, { method: "DELETE" });
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    if (activeId === id) setActiveId(null);
  }

  const inputStyle = {
    width: "100%", padding: "9px 12px",
    border: "1px solid #d1d5db", borderRadius: "8px",
    fontSize: "14px", outline: "none",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "12px", fontWeight: 600 as const,
    color: "#374151", marginBottom: "4px", display: "block" as const,
  };

  return (
    <>
      <Navbar />
      <CartDrawer />

      <main style={{ maxWidth: "680px", margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ margin: "0 0 6px", fontSize: "24px", fontWeight: 800, color: "#1f2937" }}>
            📍 Delivery Location
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#6b7280" }}>
            Manage your delivery addresses or detect current location
          </p>
        </div>

        {/* Location Detect Box */}
        <div style={{ marginBottom: "24px" }}>
          <p style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: 600, color: "#374151" }}>
            Quick detect location
          </p>
          <LocationBox
            onSelect={(loc) => {
              setDetectedLocation(loc);
              setForm((prev) => ({
                ...prev,
                city: loc.name,
                state: loc.state,
                pincode: loc.pincode,
              }));
              setShowAddForm(true);
            }}
          />
          {detectedLocation && (
            <p style={{ margin: "8px 0 0", fontSize: "12px", color: "#059669" }}>
              ✓ Location detected — fill remaining details below to save
            </p>
          )}
        </div>

        {/* Saved Addresses */}
        <div style={{
          background: "#fff", border: "1px solid #e5e7eb",
          borderRadius: "12px", padding: "20px",
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", marginBottom: "16px",
          }}>
            <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1f2937" }}>
              Saved Addresses ({addresses.length})
            </h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              style={{
                padding: "7px 16px", background: "#92400e",
                color: "#fff", border: "none", borderRadius: "8px",
                fontSize: "13px", fontWeight: 600, cursor: "pointer",
              }}
            >
              {showAddForm ? "✕ Cancel" : "+ Add New"}
            </button>
          </div>

          {/* Add Address Form */}
          {showAddForm && (
            <div style={{
              background: "#f9fafb", borderRadius: "10px",
              padding: "16px", marginBottom: "16px",
              border: "1px solid #e5e7eb",
            }}>
              <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, color: "#1f2937" }}>
                New Address
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Receiver name" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Phone *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Mobile number" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Address Line 1 *</label>
                  <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} placeholder="House no, Street" style={inputStyle} />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>Landmark</label>
                  <input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} placeholder="Landmark (optional)" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>City *</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="City"
                    style={{
                      ...inputStyle,
                      background: form.city ? "#f0fdf4" : "#fff",
                      borderColor: form.city ? "#86efac" : "#d1d5db",
                    }}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Pincode *</label>
                  <input
                    value={form.pincode}
                    onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                    placeholder="6-digit pincode"
                    style={{
                      ...inputStyle,
                      background: form.pincode ? "#f0fdf4" : "#fff",
                      borderColor: form.pincode ? "#86efac" : "#d1d5db",
                    }}
                  />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={labelStyle}>State</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" style={inputStyle} />
                </div>
              </div>
              <button
                onClick={saveAddress}
                disabled={saving}
                style={{
                  marginTop: "14px", padding: "9px 24px",
                  background: "#92400e", color: "#fff",
                  border: "none", borderRadius: "8px",
                  fontSize: "13px", fontWeight: 600, cursor: "pointer",
                }}
              >
                {saving ? "Saving..." : "Save Address"}
              </button>
            </div>
          )}

          {/* Address List */}
          {loading ? (
            <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>Loading...</p>
          ) : addresses.length === 0 ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>📭</div>
              <p style={{ margin: 0, fontSize: "14px" }}>No saved addresses yet</p>
            </div>
          ) : (
            addresses.map((addr) => (
              <div
                key={addr.id}
                style={{
                  border: addr.is_default ? "2px solid #92400e" : "1px solid #e5e7eb",
                  borderRadius: "10px", padding: "14px",
                  marginBottom: "10px", cursor: "pointer",
                  background: addr.is_default ? "#fffbf5" : "#fff",
                  transition: "all 0.2s",
                }}
                onClick={() => setDefault(addr.id)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "16px" }}>
                        {addr.is_default ? "✅" : "⭕"}
                      </span>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#1f2937" }}>
                        {addr.full_name}
                      </p>
                      {addr.is_default && (
                        <span style={{
                          background: "#fef3c7", color: "#92400e",
                          fontSize: "10px", fontWeight: 700,
                          padding: "2px 8px", borderRadius: "20px",
                        }}>
                          DEFAULT
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 2px", fontSize: "13px", color: "#4b5563", paddingLeft: "24px" }}>
                      {addr.phone}
                    </p>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6b7280", paddingLeft: "24px" }}>
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`},{" "}
                      {addr.city}, {addr.state} — {addr.pincode}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }}
                    style={{
                      background: "none", border: "none",
                      color: "#ef4444", cursor: "pointer",
                      fontSize: "16px", padding: "4px",
                      flexShrink: 0,
                    }}
                  >
                    🗑
                  </button>
                </div>
                {!addr.is_default && (
                  <p style={{ margin: "8px 0 0 24px", fontSize: "11px", color: "#9ca3af" }}>
                    Click to set as default
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}