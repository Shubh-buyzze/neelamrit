// app/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/lib/store/useCartStore";
import Navbar from "@/components/Navbar";
import Link from "next/link";

type Address = {
  id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
};

export default function CheckoutPage() {
  const { items, loading: cartLoading, fetchCart } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loadingAddrs, setLoadingAddrs] = useState(true);
  
  // Status states
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false); // Controls the Success overlay

  // Costs
  const platformFee = 5;
  const codHandlingFee = 15;
  const subtotal = items.reduce((sum, item) => sum + (item.products?.price ?? 0) * item.quantity, 0);
  const totalPayable = subtotal + platformFee + codHandlingFee; 

  // ✅ Fetch cart and addresses on mount
  useEffect(() => {
    fetchCart(); 
    fetchAddresses();
  }, [fetchCart]); 

  async function fetchAddresses() {
    try {
      const res = await fetch("/api/addresses");
      if (res.ok) {
        const json = await res.json();
        setAddresses(json.data ?? []);
        const defaultAddr = json.data?.find((a: Address) => a.is_default);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (json.data?.length > 0) {
          setSelectedAddressId(json.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch addresses");
    } finally {
      setLoadingAddrs(false);
    }
  }

  async function handlePlaceOrder() {
    if (!selectedAddressId) {
      alert("Please select a delivery address.");
      return;
    }

    setPlacingOrder(true);
    const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedAddress,
          payment_method: "COD",
          total_amount: totalPayable,
        }),
      });

      const data = await res.json();

      if (data.success) {
        await fetch("/api/cart", { method: "DELETE" }); // clear cart
        await fetchCart(); // refresh store after clearing
        
        // Trigger Success overlay
        setOrderSuccess(true);

        // Wait 2.5 seconds for animation to play, then redirect
        setTimeout(() => {
            window.location.href = "/orders";
        }, 2500);

      } else {
        alert("Failed to place order: " + data.error);
        setPlacingOrder(false);
      }
    } catch (error) {
      alert("Something went wrong. Please try again.");
      setPlacingOrder(false);
    }
  }

  // Loading State
  if (cartLoading || loadingAddrs) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 mt-24">
           <div className="w-full bg-white p-6 shadow-sm rounded-sm animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 w-1/4 rounded"></div>
              <div className="h-20 bg-gray-200 w-full rounded"></div>
           </div>
        </div>
      </div>
    );
  }

  // Empty State
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-[#f1f3f6]">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 mt-24 flex justify-center">
          <div className="w-full bg-white p-12 shadow-sm rounded-sm flex flex-col items-center justify-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Cart is empty</h2>
            <Link href="/" className="bg-[#fb641b] text-white px-8 py-2.5 rounded-sm font-bold text-sm shadow-sm hover:bg-[#e05615] transition-colors mt-4">
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f1f3f6] pb-24 md:pb-12">
        <Navbar />

        <main className="max-w-5xl mx-auto px-2 sm:px-4 flex flex-col lg:flex-row gap-4 items-start pt-20 md:pt-24">
          
          {/* LEFT COLUMN: Delivery Address & Items */}
          <div className="flex-1 w-full space-y-4">
            
            {/* Address Selection (Horizontal & Compact) */}
            <div className="bg-white rounded-sm shadow-sm">
              <div className="px-4 py-3 bg-[#2874f0] rounded-t-sm flex justify-between items-center">
                 <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                   <span className="bg-white text-[#2874f0] w-5 h-5 flex items-center justify-center rounded text-xs">1</span> 
                   Delivery Address
                 </h2>
                 <Link href="/profile" className="text-[13px] font-medium text-white hover:underline">
                    Add New
                 </Link>
              </div>

              <div className="p-4">
                {addresses.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 border border-dashed border-gray-300 rounded-sm">
                    <p className="text-[13px] text-gray-500 mb-3">No saved addresses found.</p>
                    <Link href="/profile" className="bg-white border border-gray-300 px-4 py-2 rounded-sm text-[12px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
                      Add Address
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex p-3 border rounded-sm cursor-pointer transition-all ${
                          selectedAddressId === addr.id
                            ? "border-[#2874f0] bg-[#f0f5ff]"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={addr.id}
                          checked={selectedAddressId === addr.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-0.5 w-4 h-4 text-[#2874f0] border-gray-300 focus:ring-[#2874f0]"
                        />
                        <div className="ml-3 flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <p className="text-[13px] font-medium text-gray-900 truncate pr-2">{addr.full_name}</p>
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">WORK</span>
                          </div>
                          <p className="text-[12px] text-gray-600 truncate">{addr.address_line1}, {addr.city}</p>
                          <p className="text-[12px] text-gray-600 mt-0.5"><span className="font-medium text-gray-800">{addr.phone}</span></p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Items Summary (Compact) */}
            <div className="bg-white rounded-sm shadow-sm">
              <div className="px-4 py-3 bg-[#2874f0] rounded-t-sm">
                 <h2 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                   <span className="bg-white text-[#2874f0] w-5 h-5 flex items-center justify-center rounded text-xs">2</span> 
                   Order Summary ({items.length})
                 </h2>
              </div>
              <div className="p-4 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                     <div className="w-16 h-16 bg-gray-50 border border-gray-200 flex items-center justify-center rounded-sm shrink-0">
                        {item.products?.image_url ? (
                            <img src={item.products.image_url} alt={item.products.name} className="w-full h-full object-contain p-1 mix-blend-multiply" />
                        ) : (
                            <span className="text-xl">🍯</span>
                        )}
                     </div>
                     <div className="flex-1 flex justify-between items-start">
                        <div>
                            <p className="text-[14px] font-medium text-[#212121] leading-tight">{item.products?.name}</p>
                            <p className="text-[12px] text-gray-500 mt-1">Qty: {item.quantity}</p>
                        </div>
                        <span className="text-[14px] font-bold text-[#212121]">₹{(item.products?.price ?? 0) * item.quantity}</span>
                     </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Price Breakup */}
          <div className="w-full lg:w-[320px] shrink-0 sticky top-24 space-y-4">
            <div className="bg-white rounded-sm shadow-sm">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-wide">Price Details</h2>
              </div>

              <div className="p-4 space-y-4">
                <div className="flex justify-between text-[14px] text-[#212121]">
                  <span>Price ({items.length} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between text-[14px] text-[#212121]">
                  <span>Delivery Charges</span>
                  <span className="text-[#388e3c] font-medium">Free</span>
                </div>

                {/* Added Fees */}
                <div className="flex justify-between text-[14px] text-[#212121]">
                  <span>Platform Fee</span>
                  <span>+ ₹{platformFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[14px] text-[#212121]">
                  <span>COD Handling Fee</span>
                  <span>+ ₹{codHandlingFee.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-[16px] font-bold pt-4 border-t border-dashed border-gray-300 text-[#212121]">
                  <span>Amount Payable</span>
                  <span>₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Desktop Place Order Button */}
            <div className="hidden lg:block bg-white p-4 shadow-sm rounded-sm">
                <button
                    onClick={handlePlaceOrder}
                    disabled={placingOrder || !selectedAddressId || items.length === 0}
                    className={`w-full py-3.5 rounded-sm font-bold text-white text-[15px] uppercase tracking-wide transition-colors ${
                        placingOrder || !selectedAddressId || items.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-[#fb641b] hover:bg-[#e05615] shadow-sm active:scale-[0.98]"
                    }`}
                >
                    {placingOrder ? "Placing Order..." : "Place Order (COD)"}
                </button>
            </div>

            <div className="flex items-center gap-3 p-4 text-[12px] font-medium text-gray-500 justify-center text-center leading-tight">
              <svg className="w-6 h-6 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Safe and Secure Payments. 100% Authentic products.
            </div>
          </div>

        </main>
      </div>

      {/* MOBILE FIXED BOTTOM BAR (Flipkart Style) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.08)] border-t border-gray-200 p-3 flex items-center justify-between lg:hidden z-40">
        <div className="flex flex-col">
          <span className="text-[18px] font-bold text-[#212121] leading-none">₹{totalPayable.toFixed(2)}</span>
          <span className="text-[11px] font-medium text-[#2874f0] mt-1 cursor-pointer" onClick={(e) => { window.scrollTo({top: 0, behavior: 'smooth'}); }}>View Details</span>
        </div>
        <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddressId || items.length === 0}
            className={`px-8 py-3 rounded-sm font-bold text-white text-[13px] uppercase tracking-wide transition-all ${
                placingOrder || !selectedAddressId || items.length === 0
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#fb641b] active:scale-95"
            }`}
        >
            {placingOrder ? "Processing..." : "Place Order"}
        </button>
      </div>

      {/* 🟢 SUCCESS ANIMATION OVERLAY (WITHOUT LOTTIE) */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
           
           {/* Custom SVG Checkmark Animation */}
           <div className="w-24 h-24 mb-6 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.6)] animate-in zoom-in-50 duration-500">
             <svg className="w-12 h-12 text-white animate-[ping_0.5s_ease-out_forwards_0.3s]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
             </svg>
           </div>

           <h2 className="text-white text-2xl font-bold mt-4 animate-in slide-in-from-bottom-4 duration-500 delay-300">Order Placed Successfully!</h2>
           <p className="text-gray-300 text-sm mt-2 animate-pulse">Redirecting to your orders...</p>
        </div>
      )}
    </>
  );
}