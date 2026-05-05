"use client";
import { useState } from "react";
import Image from "next/image"; // Next.js optimized image tag

const VARIANTS = [
  {
    id: "tasting",
    name: "The Tasting Edition",
    weight: "250g",
    price: 349,
    mrp: 499,
    description: "Perfect for your first bite into heritage. Six handcrafted pieces of 100% pure jaggery Lakadwa, nestled in our elegant gold-foil rigid box.",
    // Yahan apni solid background wali image ka path daaliye (e.g., /images/box-250.jpg)
    image: "https://placehold.co/800x800/fcf9f2/8b5a2b?text=250g+HD+Image", 
  },
  {
    id: "signature",
    name: "The Signature Box",
    weight: "500g",
    price: 649,
    mrp: 899,
    description: "Our absolute bestseller. A lavish spread of healthy, guilt-free sweetness designed for true connoisseurs and thoughtful gifting.",
    image: "https://placehold.co/800x800/fcf9f2/8b5a2b?text=500g+HD+Image",
  },
  {
    id: "grand",
    name: "The Grand Festive Pack",
    weight: "1 Kg",
    price: 1199,
    mrp: 1599,
    description: "Abundance of tradition. Crafted for weddings, corporate gifting, and big families. Comes with complimentary premium shipping.",
    image: "https://placehold.co/800x800/fcf9f2/8b5a2b?text=1KG+HD+Image",
  }
];

export default function PremiumShowcase() {
  const [activeTab, setActiveTab] = useState(VARIANTS[0]);
  const [isFading, setIsFading] = useState(false);

  const handleTabChange = (variant: any) => {
    if (activeTab.id === variant.id) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveTab(variant);
      setIsFading(false);
    }, 300); // 300ms smooth fade effect
  };

  return (
    <section className="min-h-screen bg-[#FCF9F2] text-gray-900 flex items-center justify-center py-20 px-6 sm:px-12 lg:px-24 font-sans">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        
        {/* Left: The Hero Image Section (Apple Style Big Image) */}
        <div className="relative w-full aspect-square md:aspect-[4/3] lg:aspect-square bg-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#f5ecd8] to-white opacity-50 z-0"></div>
          
          {/* ✨ Smooth Fade Transition Image */}
          <div className={`relative z-10 w-full h-full p-8 transition-opacity duration-300 ease-in-out ${isFading ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}>
            <img 
              src={activeTab.image} 
              alt={activeTab.name} 
              className="w-full h-full object-contain drop-shadow-2xl"
            />
          </div>
        </div>

        {/* Right: The Premium Typography & Selector */}
        <div className="flex flex-col justify-center">
          <p className="text-[#8B5A2B] font-bold tracking-[0.2em] uppercase text-xs mb-4">
            Lakadwa Origins • 100% Pure Jaggery
          </p>
          
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-serif text-gray-900 leading-tight mb-6 transition-all duration-300 ${isFading ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"}`}>
            {activeTab.name}
          </h1>
          
          <p className={`text-lg text-gray-600 mb-10 max-w-lg leading-relaxed transition-all duration-300 ${isFading ? "opacity-0" : "opacity-100"}`}>
            {activeTab.description}
          </p>

          {/* 🌟 The Apple-Style Variant Selector */}
          <div className="mb-12">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Select Edition</p>
            <div className="flex flex-wrap gap-3">
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleTabChange(v)}
                  className={`relative px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 border-2 overflow-hidden ${
                    activeTab.id === v.id 
                      ? "border-[#8B5A2B] text-[#8B5A2B] bg-[#8B5A2B]/5 shadow-sm" 
                      : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-white"
                  }`}
                >
                  {/* Subtle active indicator dot */}
                  {activeTab.id === v.id && (
                     <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#8B5A2B]"></span>
                  )}
                  <span className="block text-xs uppercase tracking-wider opacity-70 mb-1">{v.weight}</span>
                  <span className="block text-base">{v.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Add to Cart */}
          <div className={`flex flex-col sm:flex-row sm:items-center gap-8 transition-all duration-300 ${isFading ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
            <div>
              <p className="text-gray-400 text-sm font-medium line-through mb-1">₹{activeTab.mrp}</p>
              <div className="flex items-end gap-2">
                <p className="text-4xl font-black text-gray-900 tracking-tight">₹{activeTab.price}</p>
                {activeTab.id === "grand" && <span className="text-[#8B5A2B] font-bold text-sm mb-1">(Free Shipping)</span>}
              </div>
            </div>

            <button className="flex-1 bg-gray-900 text-white px-8 py-5 rounded-2xl font-bold tracking-wide hover:bg-[#8B5A2B] hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              Add to Cart
            </button>
          </div>
          
        </div>
      </div>
    </section>
  );
}