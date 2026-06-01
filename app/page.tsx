// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import Navbar from "@/components/Navbar";
import { useCartStore } from "@/lib/store/useCartStore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

import AnnotatedProduct from "@/components/AnnotatedProduct";
import LeaderboardSection from "@/components/LeaderboardSection";

export const dynamic = 'force-dynamic'

const PRODUCTS = [
  {
    id: 1,
    slug: "trial-box",
    productId: "47fb2058-b8eb-4bfd-9926-5d99e4eae9a1",
    name: "Lakadwa Origins - NEELAMRIT",
    tagline: "First Taste",
    details: "500g",
    price: 349,
    originalPrice: 499,
    media: [
      { type: "image", url: "/hero2-box.png" },
      { type: "image", url: "/trial-2.png" }, 
      { type: "video", url: "/video-1.mp4" }  
    ],
    badge: "Bestseller",
    badgeStyle: "gold" as const,
    number: "01",
    description: "Perfect for first-time tasters. Experience the authentic flavour of Lakadwa — a single generous box to discover what all the talk is about.",
    ingredients: ["Pure Jaggery", "No Palm Oil", "Gram Flour", "Zero Sugar"],
  },
  {
    id: 2,
    slug: "signature-box",
    productId: "0c9f55e2-480b-4279-a855-de75f41ab7a9",
    name: "Lakadwa Classic - NEELAMRIT",
    tagline: "Heritage Edition",
    details: "750g",
    price: 449,
    originalPrice: 749,
    media: [
      { type: "image", url: "/hero-box.webp" },
      { type: "image", url: "/sig-2.png" }, 
      { type: "video", url: "/video-2.mp4" } 
    ],
    badge: "Most Popular",
    badgeStyle: "dark" as const,
    number: "02",
    description: "Our heritage recipe in a beautiful hexagonal box. Designed for gifting — for the person you want to impress with something real and honest.",
    ingredients: ["Pure Jaggery", "Healthy", "Premium Pack", "Zero Sugar", "Gifting Choice"],
  },
  {
    id: 3,
    slug: "festival-pack",
    productId: "ded720ac-54d4-4853-bdcf-81ff1d84ac97",
    name: "Lakadwa Utsav - NEELAMRIT",
    tagline: "Grand Celebration",
    details: "1KG",
    price: 499,
    originalPrice: 999,
    media: [
      { type: "image", url: "/hero3-box.png" },
      { type: "image", url: "/fest-2.png" }, 
      { type: "video", url: "/video-3.mp4" } 
    ],
    badge: "Limited",
    badgeStyle: "maroon" as const,
    number: "03",
    description: "Grand assortment curated for festivals and celebrations. When you want to arrive with something people remember — this is it.",
    ingredients: ["100% Jaggery", "Pure Gram Flour", "Premium Nuts", "Zero Sugar", "Festival Special"],
  },
];

// Product Card Media Gallery
function ProductCardGallery({ media, altName }: { media: any[], altName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 40; 

  const active = media[currentIndex];

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      setCurrentIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
      setIsVideoPlaying(false);
    }
    if (isRightSwipe) {
      setCurrentIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
      setIsVideoPlaying(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 relative">
      <div 
        className="relative w-[90%] h-[75%] z-10 flex items-center justify-center transition-transform duration-700 hover:scale-105"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {active.type === 'video' ? (
          isVideoPlaying ? (
            <video src={active.url} controls autoPlay playsInline className="w-full h-full object-contain rounded-xl drop-shadow-lg" />
          ) : (
            <div 
              className="w-full h-full relative flex items-center justify-center bg-gray-50 rounded-xl cursor-pointer border border-gray-100"
              onClick={(e) => { e.stopPropagation(); setIsVideoPlaying(true); }} 
            >
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-transform hover:scale-110 shadow-lg">
                    <svg className="w-5 h-5 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                 </div>
               </div>
               <p className="absolute bottom-3 text-[10px] font-medium text-gray-500 uppercase tracking-widest">Click to Play</p>
            </div>
          )
        ) : (
          <Image src={active.url} alt={altName} fill className="object-contain drop-shadow-xl select-none" draggable={false} loading="lazy" />
        )}
      </div>
      
      <div className="flex gap-2 mt-4 z-20">
        {media.map((m, i) => (
          <button
            key={i}
            onMouseEnter={() => { setCurrentIndex(i); setIsVideoPlaying(false); }}
            onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); setIsVideoPlaying(false); }} 
            className={`relative w-10 h-10 md:w-12 md:h-12 rounded-lg overflow-hidden border transition-all ${
              currentIndex === i ? 'border-[#c8882a] scale-105 shadow-sm' : 'border-gray-200 hover:border-[#e8dece]'
            }`}
          >
            {m.type === 'video' ? (
              <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[#1a0a02]" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            ) : (
              <Image src={m.url} alt="thumb" fill className="object-cover select-none" draggable={false} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function ProductActions({ productId, isMobile = false }: { productId: string; isMobile?: boolean }) {
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

  if (isMobile) {
    return (
      <div className="flex gap-2 mt-2 w-full relative z-20">
        <div className="flex items-center justify-between border border-gray-200 rounded-md h-10 w-[90px] bg-white px-2 shrink-0 shadow-sm">
          <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-6 h-6 flex items-center justify-center text-gray-500 text-lg hover:text-gray-900">−</button>
          <span className="text-[13px] font-medium text-gray-900 tabular-nums">{quantity}</span>
          <button onClick={() => setQuantity(quantity + 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 text-lg hover:text-gray-900">+</button>
        </div>
        <button onClick={handleAdd} disabled={adding} className="flex-1 h-10 flex items-center justify-center gap-2 bg-[#ff9f00] text-white rounded-sm text-[13px] font-medium shadow-sm hover:bg-[#f39000] transition-colors disabled:opacity-60">
          {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Add to Cart</span>}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 relative z-20 w-full">
      <div className="flex items-center border border-gray-300 rounded-full h-12 w-[120px] bg-white px-2 shadow-sm">
        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-[#1a0a02] transition-colors text-2xl font-light">−</button>
        <span className="w-8 text-center text-[15px] font-medium tabular-nums text-[#1a0a02]">{quantity}</span>
        <button onClick={() => setQuantity(quantity + 1)} className="flex-1 h-full flex items-center justify-center text-gray-500 hover:text-[#1a0a02] transition-colors text-2xl font-light">+</button>
      </div>
      <button onClick={handleAdd} disabled={adding} className="h-12 px-16 flex-1 flex items-center justify-center gap-2 bg-amber-900 text-white hover:bg-amber-950 rounded-full text-[14px] font-medium shadow-sm transition-colors duration-300 disabled:opacity-50">
        {adding ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span>Add to Bag</span>}
      </button>
    </div>
  );
}

// Background Patterns
function SectionPatternLight() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.22] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="jali-main" x="0" y="0" width="48" height="48" patternUnits="userSpaceOnUse">
          <rect x="2" y="2" width="44" height="44" fill="none" stroke="#c8882a" strokeWidth="0.7" />
          <polygon points="24,4 44,24 24,44 4,24" fill="none" stroke="#c8882a" strokeWidth="0.55" />
          <circle cx="24" cy="24" r="7" fill="none" stroke="#c8882a" strokeWidth="0.55" />
          <path d="M24,17 Q29,24 24,31 Q19,24 24,17Z" fill="none" stroke="#c8882a" strokeWidth="0.45" />
          <path d="M17,24 Q24,29 31,24 Q24,19 17,24Z" fill="none" stroke="#c8882a" strokeWidth="0.45" />
          <circle cx="2"  cy="2"  r="1.5" fill="#c8882a" />
          <circle cx="46" cy="2"  r="1.5" fill="#c8882a" />
          <circle cx="2"  cy="46" r="1.5" fill="#c8882a" />
          <circle cx="46" cy="46" r="1.5" fill="#c8882a" />
          <circle cx="24" cy="2"  r="1" fill="#c8882a" />
          <circle cx="24" cy="46" r="1" fill="#c8882a" />
          <circle cx="2"  cy="24" r="1" fill="#c8882a" />
          <circle cx="46" cy="24" r="1" fill="#c8882a" />
          <path d="M2,8 Q2,2 8,2"   fill="none" stroke="#c8882a" strokeWidth="0.45" />
          <path d="M40,2 Q46,2 46,8" fill="none" stroke="#c8882a" strokeWidth="0.45" />
          <path d="M2,40 Q2,46 8,46" fill="none" stroke="#c8882a" strokeWidth="0.45" />
          <path d="M40,46 Q46,46 46,40" fill="none" stroke="#c8882a" strokeWidth="0.45" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jali-main)" />
    </svg>
  );
}

function BannerPatternLight() {
  return (
    <svg className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="jali-banner" x="0" y="0" width="36" height="36" patternUnits="userSpaceOnUse">
          <rect x="1.5" y="1.5" width="33" height="33" fill="none" stroke="#c8882a" strokeWidth="0.6" />
          <polygon points="18,3 33,18 18,33 3,18" fill="none" stroke="#c8882a" strokeWidth="0.5" />
          <circle cx="18" cy="18" r="5.5" fill="none" stroke="#c8882a" strokeWidth="0.5" />
          <path d="M18,12.5 Q22,18 18,23.5 Q14,18 18,12.5Z" fill="none" stroke="#c8882a" strokeWidth="0.4" />
          <path d="M12.5,18 Q18,22 23.5,18 Q18,14 12.5,18Z" fill="none" stroke="#c8882a" strokeWidth="0.4" />
          <circle cx="1.5"  cy="1.5"  r="1.2" fill="#c8882a" />
          <circle cx="34.5" cy="1.5"  r="1.2" fill="#c8882a" />
          <circle cx="1.5"  cy="34.5" r="1.2" fill="#c8882a" />
          <circle cx="34.5" cy="34.5" r="1.2" fill="#c8882a" />
          <circle cx="18" cy="1.5"  r="0.8" fill="#c8882a" />
          <circle cx="18" cy="34.5" r="0.8" fill="#c8882a" />
          <circle cx="1.5"  cy="18" r="0.8" fill="#c8882a" />
          <circle cx="34.5" cy="18" r="0.8" fill="#c8882a" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#jali-banner)" />
    </svg>
  );
}

function LaunchBadge() {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 60%, #2563eb 100%)",
        color: "#e0eaff",
        boxShadow: "0 0 0 1px rgba(59,130,246,0.4), 0 0 10px rgba(59,130,246,0.35), 0 0 20px rgba(59,130,246,0.15)",
      }}
    >
      <span
        className="absolute left-0 top-0 h-full w-1/3 opacity-20 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, #fff, transparent)" }}
      />
      <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
        <path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z" />
      </svg>
      Launch Offer
    </span>
  );
}

// 🟢 NEW: REDESIGNED LAUNCH OFFER SECTION (WITH HYDRATION FIX)
function LaunchOfferSection() {
  const [time, setTime] = useState({ d: "30", h: "00", m: "00", s: "00" });
  const [mounted, setMounted] = useState(false); // 🟢 Hydration state

  useEffect(() => {
    setMounted(true); // 🟢 Only run on client
    const KEY = "neelamrit_launch_deadline_v3";
    let deadline = Number(localStorage.getItem(KEY));
    if (!deadline || deadline < Date.now()) {
      deadline = Date.now() + 30 * 24 * 60 * 60 * 1000;
      localStorage.setItem(KEY, String(deadline));
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const tick = () => {
      const diff = Math.max(0, deadline - Date.now());
      setTime({
        d: pad(Math.floor(diff / 86400000)),
        h: pad(Math.floor((diff % 86400000) / 3600000)),
        m: pad(Math.floor((diff % 3600000) / 60000)),
        s: pad(Math.floor((diff % 60000) / 1000)),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // 🟢 Block rendering on server to prevent the Next.js Invariant Error
  if (!mounted) return null;

  const scrollToProduct = (slug: string) => {
    const el = document.getElementById(`product-${slug}`);
    if (el) {
      const offset = 80;
      const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  const OFFER_CARDS = [
    { name: "Lakadwa Origins", details: "500g", price: 349, originalPrice: 499, discount: 30, slug: "trial-box",     image: "/hero2-box.png"  },
    { name: "Lakadwa Classic", details: "750g", price: 449, originalPrice: 749, discount: 40, slug: "signature-box", image: "/hero-box.webp"   },
    { name: "Lakadwa Utsav",   details: "1 KG",  price: 499, originalPrice: 999, discount: 50, slug: "festival-pack", image: "/hero3-box.png"  },
  ];

  return (
    <section className="bg-white border-b border-[#f0e8de] py-10 md:py-14">
      <div className="max-w-5xl mx-auto px-4 md:px-6">

        {/* BIG BROWN BANNER WITH NOTICEABLE CLOCK */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl px-6 py-6 md:py-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 shadow-xl border border-[#c8882a]/30"
          style={{ background: "linear-gradient(135deg, #2a1610 0%, #1a0a02 100%)" }}
        >
          <div className="flex items-center justify-center gap-3 md:gap-4 w-full md:w-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-[0.15em] text-center whitespace-nowrap">
              Offer Ends In
            </h2>
          </div>

          <div className="flex items-start justify-center gap-2 md:gap-4 w-full md:w-auto">
            {[{ v: time.d, u: "Days" }, { v: time.h, u: "Hours" }, { v: time.m, u: "Mins" }, { v: time.s, u: "Secs" }].map((t, i) => (
              <div key={i} className="flex items-center gap-2 md:gap-4">
                <div className="flex flex-col items-center">
                  <div className="bg-[#c8882a]/15 border border-[#c8882a]/40 rounded-xl w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 flex items-center justify-center shadow-inner">
                    <span className="font-sans text-2xl sm:text-3xl md:text-4xl font-black text-[#c8882a] tabular-nums leading-none tracking-tight">{t.v}</span>
                  </div>
                  <span className="text-[9px] md:text-[11px] text-[#c8882a]/70 uppercase tracking-widest mt-2 block font-bold">{t.u}</span>
                </div>
                {i < 3 && <span className="text-white/20 font-sans text-2xl sm:text-3xl md:text-4xl font-black -mt-6">:</span>}
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3 HORIZONTAL CARDS */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.06 }}
          className="grid grid-cols-3 gap-3 md:gap-6"
        >
          {OFFER_CARDS.map((card) => (
            <div key={card.slug} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="relative bg-[#faf5ee] flex items-center justify-center overflow-hidden" style={{ aspectRatio: "4/3" }}>
                <div
                  className="absolute top-2 right-2 z-10 rounded-full w-9 h-9 md:w-11 md:h-11 flex flex-col items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg,#c8882a,#9c5518)",
                    boxShadow: "0 2px 8px rgba(200,136,42,0.4)",
                  }}
                >
                  <span className="font-sans text-[11px] md:text-[14px] font-black text-white leading-none">{card.discount}%</span>
                  <span className="font-sans text-[6px] md:text-[8px] font-bold text-white/90 uppercase leading-none mt-0.5">off</span>
                </div>
                <div className="relative w-3/4 h-3/4">
                  <Image src={card.image} alt={card.name} fill className="object-contain drop-shadow-md" loading="lazy" />
                </div>
              </div>

              <div className="p-3 md:p-4 flex flex-col flex-1">
                <p className="font-sans text-[13px] md:text-[16px] font-bold text-[#212121] leading-tight mb-1 truncate">{card.name}</p>
                <p className="font-sans text-[10px] md:text-[12px] font-medium text-gray-500 mb-3">{card.details}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-sans text-[16px] md:text-[20px] font-black text-[#212121] leading-none">₹{card.price}</span>
                  <span className="font-sans text-[11px] md:text-[13px] font-medium text-gray-400 line-through leading-none">₹{card.originalPrice}</span>
                </div>
                <button
                  onClick={() => scrollToProduct(card.slug)}
                  className="mt-auto w-full flex items-center justify-center gap-1.5 text-white rounded-lg h-9 md:h-11 text-[10px] md:text-[12px] font-bold uppercase tracking-widest transition-colors duration-200"
                  style={{ background: "#1a0a02" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#c8882a")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#1a0a02")}
                >
                  ↓ ORDER NOW
                </button>
              </div>
            </div>
          ))}
        </motion.div>

        {/* 🟢 BIG GREEN TEXT FOR VARANASI DELIVERY */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="mt-8 md:mt-10 flex items-center justify-center w-full overflow-hidden"
        >
          <h3 className="text-[13px] sm:text-[18px] md:text-[24px] lg:text-[28px] font-black text-green-600 uppercase tracking-widest whitespace-nowrap text-center w-full">
            12-HOURS DELIVERY IN VARANASI
          </h3>
        </motion.div>

      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter(); 
  
  const handleMobileImageClick = (slug: string) => {
    router.push(`/${slug}`);
  };

  return (
    <main className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <Hero />

      <div className="bg-[#1a0a02] text-[#c8882a] py-3 overflow-hidden whitespace-nowrap border-b border-[#301c0c]">
        <div className="inline-block animate-marquee">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-8 text-[10px] font-bold uppercase tracking-[0.2em]">
              ✦ GRAND LAUNCH: UP TO 50% OFF &nbsp;·&nbsp; 🚀 48-HOUR EXPRESS DELIVERY IN VARANASI &nbsp;·&nbsp; ✦ PURE DESI GHEE
            </span>
          ))}
        </div>
      </div>

      <LeaderboardSection />

      <motion.section initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, margin: "0px 0px -100px 0px" }} className="bg-[#1a0a02] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-0 divide-x divide-[#c8882a]/30">
          {[
            { num: "0g", label: "REFINED SUGAR" },
            { num: "100%", label: "PURE JAGGERY" },
            { num: "Desi", label: "GHEE USED" },
            { num: "3", label: "VARIANTS ONLY" },
          ].map((item, i) => (
            <div key={i} className="text-center px-2 py-1">
              <div className="font-serif text-2xl md:text-4xl font-medium text-[#c8882a] leading-none mb-2">{item.num}</div>
              <div className="text-[9px] md:text-[10px] font-medium text-[#c8882a]/70 uppercase tracking-[0.15em]">{item.label}</div>
            </div>
          ))}
        </div>
      </motion.section>

      <section className="py-16 md:py-24 bg-white border-b border-[#f0e8de]">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -100px 0px" }} className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#c8882a] uppercase mb-4">FIND YOUR FIT</p>
            <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#1a0a02]">Which one is yours?</h2>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -100px 0px" }} className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[500px]">
              <thead>
                <tr>
                  <th className="py-4 px-4 w-[28%]" />
                  <th className="py-4 px-3 text-center"><div className="bg-[#1a0a02] text-white text-[10px] font-bold tracking-widest uppercase py-2.5 rounded-lg mx-auto w-24">ORIGIN</div></th>
                  <th className="py-4 px-3 text-center relative"><div className="bg-[#1a0a02] text-white text-[10px] font-bold tracking-widest uppercase py-2.5 rounded-lg mx-auto w-32 relative">CLASSIC</div></th>
                  <th className="py-4 px-3 text-center"><div className="bg-[#1a0a02] text-white text-[10px] font-bold tracking-widest uppercase py-2.5 rounded-lg mx-auto w-28">UTSAV<span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-[#c8882a] text-white text-[8px] font-bold px-2 py-0.5 rounded-sm">Popular</span></div></th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Weight", vals: ["500g", "750g", "1kg"] },
                  { label: "Box", vals: ["Beige", "Brown", "White"] },
                  { label: "Best for", vals: ["First taste", "Gifting", "Celebrations"] },
                  { label: "Varanasi Delivery", vals: ["48 Hours", "48 Hours", "48 Hours"] },
                  { label: "Gift-ready", vals: ["—", "✓", "✓"] },
                ].map((row, ri) => (
                  <tr key={ri}>
                    <td className="py-4 px-4 text-[12px] text-[#6b5a4a] font-medium border-b border-[#f0e8de]/50">{row.label}</td>
                    {row.vals.map((val, ci) => (
                      <td key={ci} className={`py-4 px-3 text-center text-[12px] border-b border-[#f0e8de]/50 ${ci === 1 ? "bg-amber-50/30 text-[#1a0a02] font-semibold" : ""} ${val === "✓" ? "text-green-600 font-bold text-sm" : val === "—" ? "text-gray-300" : "text-[#1a0a02]"}`}>{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* NEW OFFER SECTION INTEGRATED HERE */}
      <LaunchOfferSection />

      <AnnotatedProduct />

      <section className="relative py-16 md:py-32 bg-white border-b border-[#f0e8de] overflow-hidden">
        <BannerPatternLight />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "0px 0px -100px 0px" }} className="w-full md:w-1/2">
              <div className="relative w-full aspect-[4/3] md:aspect-square lg:aspect-[4/3] rounded-[2rem] overflow-hidden shadow-2xl border border-[#f0e8de]">
                <Image src="/banner.webp" alt="Process Banner" fill className="object-cover" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "0px 0px -100px 0px" }} className="hidden md:flex w-full md:w-1/2 flex-col justify-center relative">
              <div className="absolute -inset-10 bg-white/95 blur-xl -z-10 rounded-[100px] pointer-events-none" />
              <p className="text-[10px] font-bold tracking-[0.25em] text-[#c8882a] uppercase mb-4">OUR PROCESS</p>
              <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#1a0a02] mb-10 leading-tight">Tradition at Work</h2>

              <div className="space-y-8">
                <div className="flex items-start gap-5">
                  <div className="w-2 h-2 rounded-full bg-[#c8882a] mt-2.5 shrink-0 shadow-[0_0_8px_rgba(200,136,42,0.8)]" />
                  <div>
                    <h4 className="font-serif text-2xl font-semibold text-[#1a0a02] mb-2">Fully Health Consious</h4>
                    <p className="text-sm text-[#6b5a4a] leading-relaxed max-w-md">This product is made up with 100% pure jaggery and Gram Flour</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-2 h-2 rounded-full bg-[#c8882a] mt-2.5 shrink-0 shadow-[0_0_8px_rgba(200,136,42,0.8)]" />
                  <div>
                    <h4 className="font-serif text-2xl font-semibold text-[#1a0a02] mb-2">Best For Your Child</h4>
                    <p className="text-sm text-[#6b5a4a] leading-relaxed max-w-md">It is best for you kids because pure jaggery is better than Sugar Chocolate</p>
                  </div>
                </div>

                <div className="flex items-start gap-5">
                  <div className="w-2 h-2 rounded-full bg-[#c8882a] mt-2.5 shrink-0 shadow-[0_0_8px_rgba(200,136,42,0.8)]" />
                  <div>
                    <h4 className="font-serif text-2xl font-semibold text-[#1a0a02] mb-2">Best For Your Old Gems</h4>
                    <p className="text-sm text-[#6b5a4a] leading-relaxed max-w-md">It is best for your old parents , GrandFather , GrandMother etc . Remember it is slightly hard !</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section id="collection-section" className="relative bg-[#fdfaf6] pb-32 pt-16 border-b border-[#f0e8de] overflow-hidden">
        <SectionPatternLight />

        <div className="relative z-10 text-center mb-10 md:mb-16 px-6 flex flex-col items-center justify-center pt-8">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative">
            <div className="absolute -inset-10 bg-[#fdfaf6]/90 blur-xl -z-10 rounded-[100px] pointer-events-none" />
            <p className="text-[10px] font-bold tracking-[0.25em] text-[#c8882a] uppercase mb-4">THE COLLECTION</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-[#1a0a02]">OUR&apos; PRODUCTS</h2>
          </motion.div>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden relative z-10 space-y-6 px-4">
          {PRODUCTS.map((product) => (
            <motion.div
              id={`product-${product.slug}`}
              key={product.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 flex flex-col relative"
            >
              <div
                className="relative w-full aspect-[4/5] flex items-center justify-center mb-3 bg-[#fdfbf7] rounded-lg border border-[#f5efe6] overflow-hidden touch-pan-y cursor-pointer"
                onClick={() => handleMobileImageClick(product.slug)}
              >
                <span className={`absolute top-2 left-2 text-white text-[9px] font-bold px-2 py-1 rounded-sm uppercase tracking-widest z-30 shadow-sm ${product.badgeStyle === 'gold' ? 'bg-[#c8882a]' : 'bg-[#1a0a02]'}`}>{product.badge}</span>
                <ProductCardGallery media={product.media} altName={product.name} />
              </div>

              <div className="flex flex-col flex-grow relative z-10 px-1">
                <h3 className="font-sans text-[15px] font-medium text-[#212121] leading-tight mb-1 line-clamp-2">{product.name}</h3>
                <p className="text-[11px] text-[#878787] font-normal mb-1">{product.details} • {product.tagline}</p>

                <div className="flex items-center gap-1.5 mb-2">
                  <div className="flex items-center bg-[#388e3c] text-white px-1.5 py-0.5 rounded-[3px] gap-0.5">
                    <span className="text-[10px] font-bold">4.9</span>
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <span className="text-[11px] text-[#878787] font-medium">(120)</span>
                </div>

                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-[18px] font-semibold text-[#212121] leading-none">₹{product.price}</span>
                  <span className="text-[12px] text-[#878787] line-through font-normal">₹{product.originalPrice}</span>
                  <span className="text-[11px] font-medium text-[#388e3c]">{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off</span>
                  <LaunchBadge />
                </div>

                <ProductActions productId={product.productId} isMobile />
              </div>
            </motion.div>
          ))}
        </div>

        {/* PC CARDS */}
        <div className="hidden md:block relative z-10 max-w-7xl mx-auto md:px-12 space-y-24">
          {PRODUCTS.map((product, idx) => (
            <motion.div
              id={`product-${product.slug}`}
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -100px 0px" }}
              transition={{ duration: 0.7 }}
              className={`flex items-center gap-12 lg:gap-16 ${idx % 2 === 1 ? "flex-row-reverse" : "flex-row"}`}
            >
              <div className="w-1/2">
                <div className="relative bg-[#fdfbf7] rounded-xl overflow-hidden aspect-[4/3] flex flex-col items-center justify-center border border-gray-200 shadow-sm">
                  <ProductCardGallery media={product.media} altName={product.name} />
                </div>
              </div>

              <div className="w-1/2 flex flex-col items-start text-left relative z-10 pl-4 lg:pl-8">
                <div className="absolute -inset-10 bg-[#fdfaf6]/90 blur-2xl -z-10 rounded-[100px] pointer-events-none" />
                
                <h3 className="font-sans text-2xl lg:text-3xl font-medium text-[#212121] leading-tight mb-2">{product.name}</h3>
                <p className="text-[14px] text-[#878787] font-normal mb-3">{product.details} • {product.tagline}</p>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center bg-[#388e3c] text-white px-2 py-0.5 rounded-[3px] gap-1">
                    <span className="text-[13px] font-bold">4.9</span>
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  </div>
                  <span className="text-[14px] text-[#878787] font-medium">(120 Ratings)</span>
                </div>

                <Link href={`/${product.slug}`} className="text-[13px] font-semibold text-amber-800 hover:text-amber-950 transition-colors mb-4">
                  View Details →
                </Link>

                <div className="flex items-center gap-3 mb-3 w-full flex-wrap">
                  <span className="font-sans text-3xl font-semibold text-[#212121] leading-none">₹{product.price}</span>
                  <span className="text-base text-[#878787] line-through font-normal">₹{product.originalPrice}</span>
                  <span className="text-[14px] font-medium text-[#388e3c]">{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% off</span>
                </div>

                <div className="mb-6 border-b border-gray-200 pb-6 w-full">
                  <LaunchBadge />
                </div>

                <p className="text-[14px] text-[#212121] leading-relaxed mb-8 font-normal max-w-lg">{product.description}</p>

                <ProductActions productId={product.productId} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-white border-b border-[#f0e8de]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "0px 0px -50px 0px" }} className="text-center mb-14">
             <h2 className="font-serif text-3xl md:text-4xl font-semibold text-[#1a0a02]">Pure &amp; Hygienic</h2>
            <p className="text-[#6b5a4a] text-sm mt-4 max-w-md mx-auto leading-relaxed">Every precaution is taken to ensure your sweets are prepared in a spotless, safe environment — just like at home.</p>
          </motion.div>
          
          <div className="grid grid-cols-5 gap-2 sm:gap-6 max-w-4xl mx-auto">
            {[
              { img: "/Handwash.png", title: "Clean Hands", desc: "Washed & sanitized" },
              { img: "/Gloves.png", title: "Gloves & Caps", desc: "Mandatory staff wear" },
              { img: "/Kitchen.png", title: "Sterile Kitchen", desc: "Daily UV sanitation" },
              { img: "/Sealpack.png", title: "Sealed Pack", desc: "Tamper-proof boxes" },
              { img: "/Delivary.png", title: "Safe Delivery", desc: "Contactless drop" },
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="text-center flex flex-col items-center">
                <div className="relative w-12 h-12 md:w-24 md:h-24 mb-3 md:mb-5 flex items-center justify-center">
                  <Image src={item.img} alt={item.title} fill className="object-contain drop-shadow-sm" loading="lazy" sizes="(max-width: 768px) 48px, 96px"/>
                </div>
                <h3 className="text-[9px] md:text-[11px] font-bold text-[#1a0a02] uppercase tracking-wide mb-1 leading-tight">{item.title}</h3>
                <p className="text-[8px] md:text-[10px] text-[#9a8878] leading-tight hidden sm:block">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-[#fdfaf6] pt-12 md:pt-16 pb-8 border-t border-[#f0e8de]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="flex justify-center md:hidden mb-10">
            <Link href="/">
              <span className="font-serif text-3xl font-bold tracking-[0.2em] text-[#1a0a02]">NEELAMRIT</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 md:gap-8 mb-12">
            
            <div className="hidden md:block col-span-1">
              <Link href="/">
                <span className="font-serif text-2xl font-bold tracking-[0.2em] text-[#1a0a02]">NEELAMRIT</span>
              </Link>
            </div>

            <div className="col-span-1">
              <h4 className="text-[11px] font-bold text-[#1a0a02] uppercase tracking-widest mb-4">Quick Links</h4>
              <ul className="space-y-3 text-xs font-medium text-[#6b5a4a]">
                <li><Link href="/" className="hover:text-[#c8882a] transition-colors">Shop Sweets</Link></li>
                <li><Link href="/orders" className="hover:text-[#c8882a] transition-colors">Track Order</Link></li>
                <li><Link href="/profile" className="hover:text-[#c8882a] transition-colors">My Account</Link></li>
                <li><Link href="/cart" className="hover:text-[#c8882a] transition-colors">Shopping Cart</Link></li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-[11px] font-bold text-[#1a0a02] uppercase tracking-widest mb-4">Legal</h4>
              <ul className="space-y-3 text-xs font-medium text-[#6b5a4a]">
                <li><Link href="/terms" className="hover:text-[#c8882a] transition-colors">Terms & Conditions</Link></li>
                <li><Link href="/privacy" className="hover:text-[#c8882a] transition-colors">Privacy Policy</Link></li>
                <li><Link href="/shipping" className="hover:text-[#c8882a] transition-colors">Shipping Policy</Link></li>
                <li><Link href="/refund" className="hover:text-[#c8882a] transition-colors">Refund & Cancellation</Link></li>
              </ul>
            </div>

            <div className="col-span-2 md:col-span-1 pt-2 md:pt-0 border-t border-[#f0e8de] md:border-none">
              <h4 className="text-[11px] font-bold text-[#1a0a02] uppercase tracking-widest mb-4 mt-6 md:mt-0">Contact Us</h4>
              <ul className="space-y-4 text-xs font-medium text-[#6b5a4a]">
                <li className="flex items-start gap-3">
                  <svg className="w-4 h-4 text-[#c8882a] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  <span className="leading-relaxed">Mughalsarai, Chandauli<br />Uttar Pradesh - 221008, India</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#c8882a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  <a href="mailto:support@neelamrit.com" className="hover:text-[#c8882a] transition-colors">support@neelamrit.com</a>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-[#c8882a] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  <a href="tel:+919305158543" className="hover:text-[#c8882a] transition-colors">+91 9305158543</a>
                </li>
              </ul>
            </div>

          </div>

          <div className="border-t border-[#f0e8de] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[10px] font-bold text-[#b0a090] uppercase tracking-[0.1em] text-center md:text-left w-full">
              &copy; {new Date().getFullYear()} Neelamrit. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 18s linear infinite; display: inline-block; }
      `}</style>
    </main>
  );
}