// components/festival.tsx
"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import AddToCartBtn from "@/components/AddToCartBtn";
import PageBackground from "@/components/PageBackground";
import Image from "next/image";
import Link from "next/link";

export default function FestivalPackPage() {
  const [quantity, setQuantity] = useState(1);
  const price = 999;
  const originalPrice = 1299;

  // Media Gallery Setup
  const media = [
    { type: "image", url: "/hero3-box.png" },
    { type: "image", url: "/fest-2.png" },
    { type: "video", url: "/video-3.mp4" }
  ];

  // Gallery States & Swipe Logic
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 40;

  const activeMedia = media[currentIndex];

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
    <PageBackground>
      <Navbar />

      <div className="pt-20 md:pt-24 pb-4 px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-6">
          <Link href="/" className="hover:text-amber-900 transition-colors">Home</Link>
          <span>/</span><span className="text-gray-900">Festival Pack</span>
        </div>

        <section className="relative z-10 pb-24 md:pb-16">
          <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start">
            
            {/* LEFT: Media Gallery (Swipeable) */}
            <div className="w-full md:w-1/2 flex-shrink-0 flex flex-col items-center">
              <div 
                className="relative aspect-[4/5] md:aspect-square w-full max-w-lg bg-[#fdfbf7] rounded-2xl md:rounded-3xl border border-[#f5efe6] shadow-sm flex items-center justify-center overflow-hidden mb-6 touch-pan-y"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              >
                {activeMedia.type === 'video' ? (
                  isVideoPlaying ? (
                    <video src={activeMedia.url} controls autoPlay playsInline className="w-full h-full object-contain p-2" />
                  ) : (
                    <div 
                      className="w-full h-full relative flex items-center justify-center bg-gray-50 cursor-pointer"
                      onClick={() => setIsVideoPlaying(true)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-sm transition-transform hover:scale-110 shadow-lg">
                          <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                      <p className="absolute bottom-6 text-[11px] font-bold text-gray-500 uppercase tracking-widest">Click to Play</p>
                    </div>
                  )
                ) : (
                  <Image src={activeMedia.url} alt="Festival Pack" fill className="object-contain drop-shadow-2xl scale-95 p-6 md:p-8 select-none" draggable={false} priority />
                )}
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-4">
                {media.map((m, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => { setCurrentIndex(idx); setIsVideoPlaying(false); }}
                    className={`relative w-14 h-14 md:w-16 md:h-16 rounded-xl border-2 overflow-hidden transition-all ${
                      currentIndex === idx ? 'border-amber-700 scale-105 shadow-md' : 'border-gray-200 hover:border-amber-400'
                    }`}
                  >
                    {m.type === 'video' ? (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-5 h-5 text-gray-800 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                      </div>
                    ) : (
                      <Image src={m.url} fill className="object-cover select-none" draggable={false} alt="thumb" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT: Details */}
            <div className="w-full md:w-1/2 flex flex-col pt-2 mt-4 md:mt-0">
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2">Festival Pack</span>
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-2 leading-tight">Festival Pack</h1>
              <p className="text-gray-500 text-sm font-medium mb-6">750g • 24 Pieces</p>

              <div className="flex items-center gap-4 mb-6">
                <span className="text-3xl font-black text-amber-900">₹{price}</span>
                <span className="text-lg text-gray-400 line-through font-medium">₹{originalPrice}</span>
                <span className="bg-green-50 text-green-700 text-xs font-bold px-2.5 py-1 rounded border border-green-100">
                  Save ₹{originalPrice - price}
                </span>
              </div>

              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-8">
                Specially curated for festivals. A grand assortment of our finest sweets.
                Perfect for sharing with family and friends during celebrations.
              </p>

              <div className="mb-8">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Key Features</h3>
                <ul className="space-y-3">
                  {["100% Pure Jaggery", "Zero Refined Sugar", "Grand Festival Assortment", "Premium Quality Ingredients"].map((point, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-gray-700 font-medium text-sm">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Desktop Cart */}
              <div className="hidden md:block border-t border-gray-100 pt-8 mt-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3">Quantity</h3>
                <div className="flex items-center gap-6">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-sm overflow-hidden h-12 w-max">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
                    <span className="w-12 h-full flex items-center justify-center font-bold text-gray-900 border-x border-gray-200">{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-full flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
                  </div>
                  <div className="flex-1">
                    <AddToCartBtn productId="prod_festival_pack" quantity={quantity} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* MOBILE FIXED BOTTOM BAR */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden h-12 flex-shrink-0">
            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-full flex items-center justify-center text-gray-600 bg-gray-50 active:bg-gray-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg></button>
            <span className="w-10 h-full flex items-center justify-center font-bold text-gray-900 border-x border-gray-200">{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-full flex items-center justify-center text-gray-600 bg-gray-50 active:bg-gray-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button>
          </div>
          <div className="flex-1 min-w-0">
            <AddToCartBtn productId="prod_festival_pack" quantity={quantity} />
          </div>
        </div>
      </div>
    </PageBackground>
  );
}