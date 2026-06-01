// app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store/useCartStore";
import Navbar from "@/components/Navbar";

export const dynamic = 'force-dynamic'

export default function CartPage() {
  const { items, loading, fetchCart, updateQty, removeItem } = useCartStore();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Expected Delivery Date calculation (Strictly 3 days from now)
  const getExpectedDelivery = () => {
    const d = new Date();
    d.setDate(d.getDate() + 3); // Aaj se 3 din baad
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const handleUpdateQty = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingId(id);
    await updateQty(id, newQty);
    setUpdatingId(null);
  };

  const handleRemove = async (id: string) => {
    if (confirm("Remove this item from cart?")) {
      setUpdatingId(id);
      await removeItem(id);
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#f1f3f6] pt-24 pb-12 px-4">
          <div className="max-w-3xl mx-auto animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded-sm w-full"></div>
            <div className="h-40 bg-gray-200 rounded-sm w-full"></div>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#f1f3f6] pt-24 pb-12 flex items-start justify-center">
          <div className="w-full max-w-4xl bg-white mx-4 mt-8 py-16 rounded-sm shadow-sm flex flex-col items-center justify-center">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Cart is Empty</h2>
            <p className="text-xs text-gray-500 mb-6">You are not added any product to cart.</p>
            <Link href="/" className="bg-amber-800 text-white px-10 py-2.5 rounded-sm font-bold text-sm shadow-sm hover:bg-amber-900 transition-colors">
              Order Now
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f1f3f6] pt-20 md:pt-24 pb-24 md:pb-12">
        <div className="max-w-3xl mx-auto px-2 sm:px-4">
          
          {/* CART ITEMS LIST */}
          <div className="w-full bg-white rounded-sm shadow-sm overflow-hidden">
            
            <div className="p-4 border-b border-gray-100 bg-white">
               <h1 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Product Details ({items.length})</h1>
            </div>

            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col gap-4 relative">
                  
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-sm border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.products?.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="object-contain w-full h-full p-1 mix-blend-multiply"
                        />
                      ) : (
                        <div className="text-2xl">🍯</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-start">
                      <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 leading-tight">
                        {item.products?.name}
                      </h3>
                      
                      <p className="text-[10px] text-gray-400 mt-1 uppercase">
                        ID: {item.id.slice(0, 10)}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-lg font-bold text-gray-900">₹{item.products?.price}</span>
                        <span className="text-[11px] text-green-600 font-bold">In Stock</span>
                      </div>

                      <p className="text-[11px] sm:text-xs text-gray-600 mt-1">
                        Expected Delivery: <span className="font-bold text-gray-900">{getExpectedDelivery()}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-6">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity <= 1}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 bg-white disabled:opacity-40"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M20 12H4" /></svg>
                      </button>
                      <div className="w-10 h-7 flex items-center justify-center text-sm font-medium text-gray-900">
                        {updatingId === item.id ? "..." : item.quantity}
                      </div>
                      <button
                        onClick={() => handleUpdateQty(item.id, item.quantity + 1)}
                        disabled={updatingId === item.id}
                        className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-full text-gray-600 bg-white"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><path d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemove(item.id)}
                      disabled={updatingId === item.id}
                      className="text-[12px] font-bold text-gray-900 hover:text-amber-800 uppercase tracking-wide"
                    >
                      Remove
                    </button>
                  </div>

                </div>
              ))}
            </div>

            {/* Desktop Checkout Button (Brown) */}
            <div className="hidden sm:flex justify-end p-4 bg-gray-50 border-t border-gray-100">
               <Link href="/checkout" className="bg-amber-800 text-white px-16 py-3 rounded-sm font-bold text-sm shadow-sm hover:bg-amber-900 transition-colors uppercase tracking-widest">
                 Checkout
               </Link>
            </div>
          </div>

        </div>
      </div>

      {/* MOBILE FIXED BOTTOM BAR (Brown Button Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 lg:hidden z-50">
        <Link 
          href="/checkout" 
          className="block w-full bg-amber-800 text-white py-3.5 rounded-sm font-bold text-center text-sm uppercase tracking-widest active:scale-95 transition-transform"
        >
          Checkout
        </Link>
      </div>
    </>
  );
}