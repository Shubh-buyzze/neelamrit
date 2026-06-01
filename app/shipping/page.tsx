// app/shipping/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf6]">
      <Navbar />
      
      <main className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0a02] mb-4">Shipping Policy</h1>
          <p className="text-sm font-medium text-[#c8882a] uppercase tracking-widest">Safe & Secure Delivery</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#f0e8de] text-[#6b5a4a] space-y-8 leading-relaxed">
          
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">1. Processing Time</h2>
            <p>All Neelamrit sweets are made fresh to ensure maximum quality and taste. Orders are typically processed and dispatched from our kitchen in Mughalsarai within <strong>1 to 2 business days</strong>.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">2. Estimated Delivery Time</h2>
            <p>Once dispatched, the standard delivery time is <strong>3 to 5 business days</strong> depending on your location in India. You will be provided with an expected delivery date on your tracking dashboard.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">3. Packaging</h2>
            <p>We use high-quality, tamper-proof packaging to ensure your sweets remain fresh, pure, and intact during transit. The hygienic condition of the package is our topmost priority.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">4. Order Tracking</h2>
            <p>You can easily track the live status of your order by logging into your account and visiting the <strong>My Orders</strong> section.</p>
          </section>

          <div className="pt-6 border-t border-[#f0e8de]">
            <p>For any shipping-related queries, please feel free to call us at <span className="font-bold text-[#1a0a02]">+91 9305158543</span>.</p>
          </div>
          
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-sm font-bold text-[#c8882a] hover:text-[#1a0a02] uppercase tracking-widest transition-colors">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}