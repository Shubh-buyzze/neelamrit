"use client";

import { useCartStore } from "@/lib/store/useCartStore";

export default function CartDrawer() {
  // Zustand se seedha functions aur state nikaalo
  const { isOpen, closeCart, items, loading, updateQty, removeItem } = useCartStore();

  const total = items.reduce(
    (sum, item) => sum + (item.products?.price ?? 0) * item.quantity,
    0
  );

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "flex-end",
      }}
      onClick={closeCart}
    >
      <div
        style={{
          width: "100%", maxWidth: "400px", background: "#fff",
          height: "100%", display: "flex", flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.12)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid #e5e7eb",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "#1f2937" }}>
            🛒 Your Cart ({items.length})
          </h2>
          <button
            onClick={closeCart}
            style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          {loading && items.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af" }}>Loading...</p>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9ca3af" }}>
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>🛒</div>
              <p style={{ margin: 0 }}>Cart is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} style={{
                display: "flex", gap: "12px", alignItems: "center",
                padding: "14px 0", borderBottom: "1px solid #f3f4f6",
              }}>
                <div style={{
                  width: "52px", height: "52px", background: "#fef3c7",
                  borderRadius: "8px", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: "24px",
                  flexShrink: 0,
                }}>
                  🍮
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 6px", fontWeight: 600, fontSize: "14px", color: "#1f2937" }}>
                    {item.products?.name}
                  </p>
                  <p style={{ margin: "0 0 8px", fontSize: "14px", fontWeight: 700, color: "#92400e" }}>
                    ₹{item.products?.price}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      style={{
                        width: "28px", height: "28px", border: "1px solid #d1d5db",
                        borderRadius: "6px", background: "#f9fafb", cursor: "pointer", 
                        fontSize: "16px", fontWeight: 600, display: "flex", 
                        alignItems: "center", justifyContent: "center",
                      }}
                    >−</button>
                    <span style={{ fontSize: "14px", fontWeight: 600, minWidth: "20px", textAlign: "center" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      style={{
                        width: "28px", height: "28px", border: "1px solid #d1d5db",
                        borderRadius: "6px", background: "#f9fafb", cursor: "pointer", 
                        fontSize: "16px", fontWeight: 600, display: "flex", 
                        alignItems: "center", justifyContent: "center",
                      }}
                    >+</button>
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        marginLeft: "8px", background: "none", border: "none",
                        color: "#ef4444", cursor: "pointer", fontSize: "16px",
                      }}
                    >🗑</button>
                  </div>
                </div>
                <span style={{ fontWeight: 700, color: "#92400e", fontSize: "15px", flexShrink: 0 }}>
                  ₹{((item.products?.price ?? 0) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div style={{ padding: "20px 24px", borderTop: "1px solid #e5e7eb", background: "#fafafa" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "#374151" }}>Total</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#92400e" }}>
                ₹{total.toFixed(2)}
              </span>
            </div>
            <button
              onClick={() => {
                closeCart();
                window.location.href = "/checkout";
              }}
              style={{
                width: "100%", padding: "14px", background: "#92400e", color: "#fff",
                border: "none", borderRadius: "8px", fontSize: "15px", fontWeight: 700, cursor: "pointer",
              }}
            >
              Proceed to Checkout →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}