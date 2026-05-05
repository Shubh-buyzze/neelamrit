// app/terms/page.tsx
"use client";

import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#fdfaf6]">
      <Navbar />
      
      <main className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-[#1a0a02] mb-4">Terms & Conditions</h1>
          <p className="text-sm font-medium text-[#c8882a] uppercase tracking-widest">Last updated: May 2026</p>
        </div>

        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-[#f0e8de] text-[#6b5a4a] space-y-8 leading-relaxed">
          
          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">1. Introduction</h2>
            <p>Welcome to Neelamrit. By accessing our website and purchasing our products, you agree to be bound by these Terms and Conditions. Please read them carefully before using our website.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">2. Products & Pricing</h2>
            <p>All our sweets are handcrafted using 100% pure jaggery, desi ghee, and premium ingredients. Prices for our products are subject to change without notice. We reserve the right to modify or discontinue any product at any time.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">3. Accuracy of Information</h2>
            <p>We have made every effort to display the colors, packaging, and descriptions of our products as accurately as possible. However, as our sweets are handmade, slight variations in appearance or weight may occur.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">4. User Account & Security</h2>
            <p>You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.</p>
          </section>

          <section>
            <h2 className="font-serif text-2xl font-bold text-[#1a0a02] mb-3">5. Intellectual Property</h2>
            <p>All content on this website, including logos, text, images, and graphics, is the property of Neelamrit and is protected by copyright and intellectual property laws.</p>
          </section>

          <div className="pt-6 border-t border-[#f0e8de]">
            <p className="font-bold text-[#1a0a02]">Contact Information:</p>
            <p>Neelamrit (Lakadwa Origins)<br/>Mughalsarai, Chandauli, Uttar Pradesh - 221008, India<br/>Email: support@neelamrit.com</p>
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