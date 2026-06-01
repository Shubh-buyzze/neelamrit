// app/privacy/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf6]">
      <Navbar />
      
      <main className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0a02] mb-4">Privacy Policy</h1>
          <p className="text-sm font-medium text-[#c8882a] uppercase tracking-widest">Securing your trust</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#f0e8de] text-[#6b5a4a] space-y-8 leading-relaxed">
          
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">1. Information We Collect</h2>
            <p>When you visit Neelamrit or make a purchase, we collect necessary personal information such as your name, billing/shipping address, email address, and phone number to fulfill your orders efficiently.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>To process and deliver your orders accurately.</li>
              <li>To communicate with you regarding your order status.</li>
              <li>To provide customer support and handle cancellation/refund requests.</li>
              <li>To send essential updates about our website or your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">3. Data Protection</h2>
            <p>Your privacy is our priority. We implement high-level security measures to maintain the safety of your personal information. We do not sell, trade, or rent your personal data to outside parties.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">4. Cookies</h2>
            <p>Our website uses "cookies" to enhance your shopping experience, remember your cart items, and understand how you interact with our website to improve our services.</p>
          </section>

          <div className="pt-6 border-t border-[#f0e8de]">
            <p>If you have any questions regarding this Privacy Policy, please contact us at <a href="mailto:support@neelamrit.com" className="text-[#c8882a] font-bold">support@neelamrit.com</a>.</p>
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