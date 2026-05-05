// components/AnnotatedProduct.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function AnnotatedProduct() {
  return (
    <section className="py-20 md:py-32 bg-[#fdfaf6] relative overflow-hidden border-b border-[#f0e8de]">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center mb-10 md:mb-16">
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#c8882a] uppercase mb-4">
            Anatomy of a Classic
          </p>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#1a0a02]">
            Nothing to hide.
          </h2>
        </div>

        {/* ── 1. MOBILE LAYOUT (Circular with Dotted Arrows) ── */}
        <div className="md:hidden relative w-full h-[500px] flex items-center justify-center">
          
          {/* SVG Dotted Arrows Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 500">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#c8882a" />
              </marker>
            </defs>
            {/* Top Left Arrow */}
            <path d="M100,120 L160,190" stroke="#c8882a" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
            {/* Top Right Arrow */}
            <path d="M300,120 L240,190" stroke="#c8882a" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
            {/* Bottom Left Arrow */}
            <path d="M100,380 L160,310" stroke="#c8882a" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
            {/* Bottom Right Arrow */}
            <path d="M300,380 L240,310" stroke="#c8882a" strokeWidth="1.5" strokeDasharray="5,5" markerEnd="url(#arrowhead)" />
          </svg>

          {/* Center Product Image (Increased Size) */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="relative w-64 h-64 z-10"
          >
            {/* Backdrop glow */}
            <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl" />
            <Image
              src="/lakdwa.webp"
              alt="Lakadwa Sweet Detail"
              fill
              className="object-contain drop-shadow-[0_25px_40px_rgba(26,10,2,0.2)]"
            />
          </motion.div>

          {/* Annotations Headings (Absolute Positioned around image) */}
          {/* TL */}
          <div className="absolute top-16 left-2 w-[120px] text-center">
            <h3 className="text-[#1a0a02] font-serif text-[15px] font-bold leading-tight">
              0%<br/>Sugar
            </h3>
          </div>
          {/* TR */}
          <div className="absolute top-16 right-2 w-[120px] text-center">
            <h3 className="text-[#1a0a02] font-serif text-[15px] font-bold leading-tight">
              Pure<br/>Besan
            </h3>
          </div>
          {/* BL */}
          <div className="absolute bottom-16 left-2 w-[120px] text-center">
            <h3 className="text-[#1a0a02] font-serif text-[15px] font-bold leading-tight">
              No Palm<br/>Oil
            </h3>
          </div>
          {/* BR */}
          <div className="absolute bottom-16 right-2 w-[120px] text-center">
            <h3 className="text-[#1a0a02] font-serif text-[14px] font-bold leading-tight">
              100% Healthy<br/>For Everyone
            </h3>
          </div>
        </div>


        {/* ── 2. PC LAYOUT (Classic Editorial, side-by-side) ── */}
        <div className="hidden md:flex relative flex-col md:flex-row items-center justify-center gap-12 md:gap-24 mt-10">
          
          {/* Left Text Column */}
          <div className="flex flex-col gap-16 md:text-right w-full md:w-1/3 z-20">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-[#1a0a02] font-serif text-2xl font-semibold mb-3">0% Sugar</h3>
              <p className="text-[13px] text-[#8a7a6a] leading-relaxed">
                We use absolutely no refined sugar in our recipe, ensuring a lower glycemic index and a guilt-free sweet experience for you and your family.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 className="text-[#1a0a02] font-serif text-2xl font-semibold mb-3">No Palm Oil</h3>
              <p className="text-[13px] text-[#8a7a6a] leading-relaxed">
                We strictly avoid cheap substitutes like palm oil or dalda. Every batch is crafted using only pure, traditional ingredients for an honest taste.
              </p>
            </motion.div>
          </div>

          {/* PC Image Center */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            whileInView={{ scale: 1, opacity: 1 }} 
            viewport={{ once: true }}
            className="relative w-80 h-80 lg:w-96 lg:h-96 shrink-0 z-10"
          >
            <div className="absolute inset-0 bg-[#f5efe6] rounded-full blur-3xl opacity-60" />
            <Image
              src="/lakdwa.webp"
              alt="Lakadwa Sweet Detail"
              fill
              className="object-contain drop-shadow-2xl"
            />
          </motion.div>

          {/* Right Text Column */}
          <div className="flex flex-col gap-16 text-left w-full md:w-1/3 z-20">
             <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <h3 className="text-[#1a0a02] font-serif text-2xl font-semibold mb-3">Pure Besan</h3>
              <p className="text-[13px] text-[#8a7a6a] leading-relaxed">
                Made with premium quality, stone-ground gram flour. It gives our sweets their authentic, rich texture and a naturally roasted aroma.
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              <h3 className="text-[#1a0a02] font-serif text-2xl font-semibold mb-3">100% Healthy For Everyone</h3>
              <p className="text-[13px] text-[#8a7a6a] leading-relaxed">
                Crafted thoughtfully with clean, wholesome ingredients. It’s a traditional treat that every generation can enjoy without worrying about their health.
              </p>
            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}