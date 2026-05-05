// components/ProductSection.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store/useCartStore";

const PRODUCTS = [
  {
    id: 1,
    slug: "trial-box",
    productId: "47fb2058-b8eb-4bfd-9926-5d99e4eae9a1",
    name: "Trial Box",
    tagline: "First Taste",
    details: "250g • 8 Pieces",
    price: 349,
    originalPrice: 499,
    image: "/hero2-box.png",
    badge: "Bestseller",
    badgeStyle: "gold" as const,
    number: "01",
    description: "Perfect for first-time tasters. Experience the authentic flavour of Lakadwa — a single generous box to discover what all the talk is about.",
    ingredients: ["Pure Jaggery", "Desi Ghee", "Dry Fruits", "Zero Sugar"],
  },
  {
    id: 2,
    slug: "signature-box",
    productId: "0c9f55e2-480b-4279-a855-de75f41ab7a9",
    name: "Signature Box",
    tagline: "Heritage Edition",
    details: "500g • 16 Pieces",
    price: 649,
    originalPrice: 849,
    image: "/hero-box.png",
    badge: "Most Popular",
    badgeStyle: "dark" as const,
    number: "02",
    description: "Our heritage recipe in a beautiful hexagonal box. Designed for gifting — for the person you want to impress with something real and honest.",
    ingredients: ["Pure Jaggery", "Desi Ghee", "Premium Nuts", "Zero Sugar", "Hexagonal Box"],
  },
  {
    id: 3,
    slug: "festival-pack",
    productId: "ded720ac-54d4-4853-bdcf-81ff1d84ac97",
    name: "Festival Pack",
    tagline: "Grand Celebration",
    details: "750g • 24 Pieces",
    price: 999,
    originalPrice: 1299,
    image: "/hero3-box.png",
    badge: "Limited",
    badgeStyle: "maroon" as const,
    number: "03",
    description: "Grand assortment curated for festivals and celebrations. When you want to arrive with something people remember — this is it.",
    ingredients: ["Pure Jaggery", "Desi Ghee", "Premium Nuts", "Zero Sugar", "24 Pieces"],
  },
];

/* Reusable faint grid for product backgrounds */
function CardPattern() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="card-hex" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M16 0l16 9v14l-16 9-16-9V9z" fill="none" stroke="#e8dece" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#card-hex)" />
    </svg>
  );
}

function ProductActions({ productId, price }: { productId: string; price: number }) {
  const [quantity, setQuantity] = useState(1);
  const { fetchCart } = useCartStore();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
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
      } else if (res.status === 401) {
        alert("Please login to add items");
        window.location.href = "/login";
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Network error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      {/* Ghost Quantity UI */}
      <div className="flex items-center border border-[#e0d4c4] rounded-full overflow-hidden bg-transparent h-12 w-28 shrink-0">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full flex items-center justify-center text-[#9a8878] hover:text-[#1a0a02] transition-colors text-xl font-light">−</button>
        <span className="w-8 text-center text-sm font-medium text-[#1a0a02]">{quantity}</span>
        <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full flex items-center justify-center text-[#9a8878] hover:text-[#1a0a02] transition-colors text-xl font-light">+</button>
      </div>

      {/* Ghost Add Button */}
      <button
        onClick={handleAdd}
        disabled={adding}
        className="flex-1 flex items-center justify-center gap-2 border border-[#e0d4c4] text-[#b0a090] hover:text-[#1a0a02] hover:border-[#1a0a02] rounded-full h-12 px-6 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-50 bg-transparent"
      >
        {adding ? <div className="w-4 h-4 border-2 border-[#1a0a02]/30 border-t-[#1a0a02] rounded-full animate-spin" /> : <span>Add to Bag</span>}
      </button>
    </div>
  );
}

export default function ProductSection() {
  return (
    <section className="relative bg-white pb-24 pt-16 border-b border-[#f0e8de]">
      <div className="relative z-10 text-center mb-16">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-[10px] font-bold tracking-[0.25em] text-[#c8882a] uppercase mb-4">
            THE COLLECTION
          </p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-[#1a0a02]">
            Three. That&apos;s all.
          </h2>
        </motion.div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-6 space-y-20">
        {PRODUCTS.map((product, idx) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-none md:rounded-2xl relative"
          >
            {/* Top Meta Info */}
            <div className="relative px-2 md:px-0 pt-6 pb-6">
              <span className="absolute -top-12 md:-top-16 right-0 font-serif text-[120px] md:text-[160px] font-light text-[#fdfaf6] leading-none select-none pointer-events-none -z-10 tracking-tighter">
                {product.number}
              </span>

              <div className="flex items-center gap-3 mb-3">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${product.badgeStyle === "gold" ? "bg-[#c8882a] text-white" : "bg-[#1a0a02] text-white"}`}>
                  {product.badge}
                </span>
                <span className="text-[10px] font-bold tracking-[0.2em] text-[#c8882a] uppercase">
                  {product.tagline}
                </span>
              </div>

              <h3 className="font-serif text-4xl md:text-5xl font-semibold text-[#1a0a02] leading-none mb-3">
                {product.name}
              </h3>
              <p className="text-[12px] text-[#9a8878] font-medium tracking-wide">
                {product.details} • Handcrafted
              </p>
            </div>

            {/* Product Image Stage */}
            <div className="relative bg-[#fdfaf6] rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-[#f0e8de] mb-6">
              <CardPattern />
              <div className="relative w-56 h-56 md:w-72 md:h-72 z-10 transition-transform duration-700 hover:scale-105">
                <Image src={product.image} alt={product.name} fill className="object-contain drop-shadow-2xl" priority={idx === 0} />
              </div>
            </div>

            {/* Bottom Body Info */}
            <div className="px-2 md:px-0">
              <div className="flex items-center gap-3 mb-6">
                <span className="font-serif text-4xl font-semibold text-[#1a0a02]">₹{product.price}</span>
                <span className="text-lg text-[#c8c0b4] line-through font-medium">₹{product.originalPrice}</span>
                <span className="text-[10px] font-bold text-green-700 border border-green-200 bg-green-50 px-2.5 py-1 rounded-md ml-1">Save ₹{product.originalPrice - product.price}</span>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {product.ingredients.map((ing) => (
                  <span key={ing} className="text-[10px] font-medium text-[#c8882a] border border-[#c8882a]/40 bg-white px-3 py-1.5 rounded-full">{ing}</span>
                ))}
              </div>

              <p className="text-sm text-[#6b5a4a] leading-relaxed mb-8 max-w-lg">
                {product.description}
              </p>

              <ProductActions productId={product.productId} price={product.price} />

              <div className="mt-6 flex justify-center md:justify-start">
                 <Link href={`/${product.slug}`} className="text-[11px] text-[#c8882a] font-bold uppercase tracking-widest hover:text-[#1a0a02] transition-colors">
                  View full details →
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}