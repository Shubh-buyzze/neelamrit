"use client";

import { useState } from "react";

export default function AddToCartButton({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  async function addToCart() {
    setLoading(true);

    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });

    const result = await res.json();
    setLoading(false);

    if (!result.success) {
      if (result.error === "Unauthorized") {
        alert("Please login first!");
        window.location.href = "/login";
      } else {
        alert("Error: " + result.error);
      }
      return;
    }

    setAdded(true);
    // Cart count update karo navbar mein
    window.dispatchEvent(new Event("cart-updated"));

    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <button
      onClick={addToCart}
      disabled={loading}
      style={{
        width: "100%",
        padding: "10px",
        background: added ? "#16a34a" : loading ? "#d1d5db" : "#92400e",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontSize: "14px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        transition: "background 0.2s",
      }}
    >
      {loading ? "Adding..." : added ? "✓ Added!" : "+ Add to Cart"}
    </button>
  );
}