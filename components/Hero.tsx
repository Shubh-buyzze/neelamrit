"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mounted, setMounted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Detect low-end devices to reduce particle count
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const conn = (navigator as any).connection;
    const slow = conn && (conn.effectiveType === '2g' || conn.saveData);
    setIsLowEnd(isMobile || slow);

    // Attempt to play video immediately (no delay for PC)
    if (videoRef.current && !videoError) {
      videoRef.current.play().catch((err) => {
        console.warn("Autoplay failed:", err);
        setVideoError(true);
      });
    }
  }, [videoError]);

  if (!mounted) return null;

  const particleCount = isLowEnd ? 12 : 20;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#1a1a1a] pt-16">
      {/* ==================== VIDEO BACKGROUND ==================== */}
      <div className="absolute inset-0 z-0">
        {!videoError ? (
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            poster="/sig-2.png"
            onError={() => setVideoError(true)}
          >
            <source src="/videos/lakadwa-brand.mp4" type="video/mp4" />
            <source src="/videos/lakadwa-brand.webm" type="video/webm" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <Image
            src="/hero-box.png"
            alt="Lakadwa Heritage"
            fill
            className="object-cover scale-110"
            priority
          />
        )}

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-900/20 via-transparent to-transparent" />
      </div>

      {/* ==================== ANIMATED BACKGROUND ==================== */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Rotating rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear", repeatDelay: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] border border-amber-400/20 rounded-full will-change-transform"
          style={{ willChange: 'transform' }}
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear", repeatDelay: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-amber-500/15 rounded-full will-change-transform"
          style={{ willChange: 'transform' }}
        />
        <motion.div
          animate={{ rotate: 180 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear", repeatDelay: 0 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] border border-amber-300/10 rounded-full will-change-transform"
          style={{ willChange: 'transform' }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(particleCount)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 bg-amber-400/40 rounded-full will-change-transform"
              initial={{
                x: `${(i * 13) % 100}%`,
                y: `${(i * 17) % 100}%`,
              }}
              animate={{
                y: [null, -40, 40, -30, 30, 0],
                x: [null, 30, -30, 20, -20, 0],
              }}
              transition={{
                duration: 12 + (i % 8),
                repeat: Infinity,
                repeatType: "mirror",
                ease: "linear",
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        {/* Soft glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-amber-500/10 blur-3xl rounded-full" />
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-12 md:items-center">
          {/* LEFT: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-[10px] font-black tracking-[0.4em] text-amber-300 uppercase mb-4 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full"
            >
              Lakadwa
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight drop-shadow-2xl"
            >
              100% Pure Jaggery
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base text-amber-100/80 max-w-md mt-6 font-medium drop-shadow"
            >
              Zero refined sugar. Handcrafted tradition. <br />
              Timeless taste, rooted in heritage.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-row items-center gap-5 mt-10"
            >
              <button className="px-8 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-sm font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/30 hover:shadow-amber-600/30">
                Shop Collection
              </button>
              <button className="px-8 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full text-sm font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95">
                Our Story
              </button>
            </motion.div>
          </motion.div>

          {/* RIGHT: Visual Element */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative flex justify-center items-center"
          >
            <div className="relative w-full max-w-[450px] aspect-square">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4"></div>
                  <p className="text-amber-200/60 text-sm font-serif italic"></p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center justify-center min-h-[80vh] text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-block text-[9px] font-black tracking-[0.3em] text-amber-300 uppercase mb-4 bg-black/30 backdrop-blur-sm px-3 py-1 rounded-full"
            >
              Lakadwa Origins
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl font-black text-white leading-tight drop-shadow-2xl"
            >
              100% Pure Jaggery
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm text-amber-100/80 max-w-xs mx-auto mt-5 font-medium drop-shadow"
            >
              Zero refined sugar. Handcrafted tradition.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col items-center gap-3 mt-8"
            >
              <button className="w-full max-w-[200px] px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/30">
                Shop Collection
              </button>
              <button className="w-full max-w-[200px] px-6 py-3 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full text-[11px] font-black uppercase tracking-widest hover:bg-white/20 transition-all active:scale-95">
                Our Story
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden sm:block">
        <div className="flex flex-col items-center gap-1">
          <span className="text-[8px] font-black tracking-[0.3em] text-white/50 uppercase">
            Scroll
          </span>
          <div className="w-5 h-8 border border-white/30 rounded-full flex justify-center">
            <div className="w-1 h-1.5 bg-white/50 rounded-full mt-1.5" />
          </div>
        </div>
      </div>
    </section>
  );
}