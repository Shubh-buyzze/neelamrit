// components/HeroQuote.tsx
"use client";

import { motion } from "framer-motion";

export default function HeroQuote() {
  return (
    <section className="py-24 bg-white text-center px-6 border-b border-[#f0e8de]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto flex flex-col items-center"
      >
        <p className="text-[10px] font-bold tracking-[0.28em] text-[#c8882a] uppercase mb-8">
          LAKADWA ORIGINS · VARANASI
        </p>
        
        <h2 className="font-serif text-4xl md:text-6xl font-light text-[#1a0a02] leading-tight mb-2">
          Not mass-made.
          <br />
          <em className="font-semibold italic">Never will be.</em>
        </h2>
        
        {/* Subtle vertical gold divider */}
        <div className="h-12 w-px bg-gradient-to-b from-[#c8882a]/80 to-transparent my-8" />
        
        <p className="text-sm md:text-[15px] text-[#6b5a4a] leading-relaxed max-w-xl mx-auto font-light">
          We make three sweets. Each batch is small, each piece handcrafted. No refined sugar. No compromise. Just the honest taste of jaggery and ghee — the way it was always meant to be.
        </p>
      </motion.div>
    </section>
  );
}