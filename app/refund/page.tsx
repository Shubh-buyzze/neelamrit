// app/refund/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf6]">
      <Navbar />
      
      <main className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0a02] mb-4">Refund & Cancellation</h1>
          <p className="text-sm font-medium text-[#c8882a] uppercase tracking-widest">Our policies on returns</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#f0e8de] text-[#6b5a4a] space-y-8 leading-relaxed">
          
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">1. Order Cancellation</h2>
            <p>You can request to cancel your order directly from your <strong>My Orders</strong> dashboard before the order is marked as "Shipped". Once an order is dispatched from our kitchen, it cannot be cancelled as our products are perishable food items.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">2. Return Policy</h2>
            <p>Due to the perishable nature of our sweets, <strong>we do not accept returns</strong> once the product has been successfully delivered. We strictly adhere to high hygiene standards and cannot take back food products.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">3. Refunds for Damaged/Wrong Items</h2>
            <p>We take extreme care in packaging. However, if you receive a damaged box or the wrong item, please contact us at <strong>support@neelamrit.com</strong> within 24 hours of delivery with photographic proof. Upon verification, we will process a replacement or a full refund.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">4. Refund Processing Time</h2>
            <p>If your cancellation or refund request is approved, the refund will be initiated to your original method of payment. It generally takes <strong>5 to 7 working days</strong> for the amount to reflect in your bank account.</p>
          </section>
          
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