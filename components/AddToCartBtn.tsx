// components/AddToCartBtn.tsx
"use client";

import { useState } from "react";
import { useCartStore } from "@/lib/store/useCartStore";
import { toast } from "./Toast";

export default function AddToCartBtn({ 
  productId, 
  compact = false,
  quantity = 1
}: { 
  productId: string;
  compact?: boolean;
  quantity?: number;
}) {
  const { fetchCart } = useCartStore();
  const [adding, setAdding] = useState(false);

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        await fetchCart();
        toast.success("Added to bag ✓");
      } else if (res.status === 401) {
        toast.error("Please login to add items");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      } else {
        toast.error(data.error || "Something went wrong");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  // Bag icon – matches header cart button style
  const BagIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );

  if (compact) {
    return (
      <button
        onClick={handleAdd}
        disabled={adding}
        className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md flex justify-center items-center gap-2 bg-amber-800 hover:bg-black hover:shadow-xl hover:-translate-y-0.5"
      >
        {adding ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <BagIcon />
            <span>ADD</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={adding}
      className="group px-8 py-4 bg-amber-800 hover:bg-black text-white rounded-xl text-sm font-black uppercase tracking-wider transition-all shadow-md hover:shadow-xl flex items-center justify-center gap-3 min-w-[200px]"
    >
      {adding ? (
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <>
          <BagIcon />
          <span>ADD TO BAG</span>
        </>
      )}
    </button>
  );
}