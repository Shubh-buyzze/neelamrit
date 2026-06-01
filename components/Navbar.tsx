// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import LocationBox from "./LocationBox";
import { useCartStore } from "@/lib/store/useCartStore";

export default function Navbar() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [brandIndex, setBrandIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const supabase = createBrowserClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co"),
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key")
  );

  const { items } = useCartStore();

  const brandVariants = [
    { text: "NEELAMRIT", fontClass: "font-serif tracking-[0.2em]" },
    { text: "NEELAMRIT", fontClass: "font-sans font-light tracking-wider" },
    { text: "NEELAMRIT", fontClass: "font-mono tracking-tight" },
    { text: "नीलामृत", fontClass: "font-hindi tracking-normal" },
    { text: "NEELAMRIT", fontClass: "font-serif font-black tracking-[0.25em]" },
  ];

  useEffect(() => {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
  }, [items]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setBrandIndex((prev) => (prev + 1) % brandVariants.length);
        setTimeout(() => setIsAnimating(false), 50);
      }, 150);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from("users_profile")
          .select("role, full_name")
          .eq("id", session.user.id)
          .single();
          
        if (profile?.role === "admin") setIsAdmin(true);

        const name = profile?.full_name || session.user.user_metadata?.full_name;
        if (name) {
          setUserName(name);
        } else {
          const email = session.user.email || "";
          setUserName(email.includes("@neelamrit.com") ? `User (${email.split("@")[0]})` : email);
        }
      } else {
        // 🟢 SILENT MONITOR LOGIC: Agar session nahi hai, check karo kya pehle login tha
        const wasLoggedIn = localStorage.getItem("neelamrit_auth_flag");
        // Agar user pehle login tha aur abhi login page par nahi hai, toh auto-trigger ke liye bhejo
        if (wasLoggedIn === "true" && !pathname.includes("/login")) {
          router.push("/login?auto=true");
        }
      }
    };
    fetchUserStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (!session) {
        setIsAdmin(false);
        setUserName("");
      } else {
        fetchUserStatus();
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase, pathname, router]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsProfileOpen(false);
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) setMobileMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    // 🟢 REMOVE FLAG ON EXPLICIT LOGOUT
    localStorage.removeItem("neelamrit_auth_flag");
    
    await supabase.auth.signOut();
    setIsProfileOpen(false);
    setUser(null);
    setIsAdmin(false);
    setUserName("");
    router.push("/login");
    router.refresh();
  };

  if (!isMounted) return null;

  return (
    <>
      <nav
        className={`fixed top-0 w-full z-[100] transition-all duration-500 border-b border-gray-100 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-white"
        } py-2 md:${scrolled ? "py-2" : "py-4"}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            {/* LEFT SECTION */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="md:hidden relative" ref={mobileMenuRef}>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 -ml-2 text-gray-700 hover:bg-gray-100 rounded-full transition-all focus:outline-none"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                {mobileMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white border border-gray-100 rounded-2xl shadow-xl py-3 z-[110] animate-in fade-in slide-in-from-top-2">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">Home</Link>
                    <Link href="/shop" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">Shop</Link>
                    <Link href="/story" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">Our Story</Link>
                    <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-2.5 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">Contact</Link>
                  </div>
                )}
              </div>

              <div className="hidden md:block w-full max-w-sm">
                <LocationBox compact />
              </div>
            </div>

            {/* CENTER: Logo (Top) + Brand (Bottom) */}
            <div className="flex-shrink-0 text-center mx-2">
              <Link href="/" className="flex flex-col items-center group">
                <div className="relative h-10 sm:h-12 w-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <img 
                    src="/favicon.webp" 
                    alt="Logo" 
                    className="h-full w-auto object-contain"
                  />
                </div>
                <div className="relative h-4 flex items-center justify-center mt-1">
                  <span
                    key={brandIndex}
                    className={`inline-block transition-all duration-200 ease-in-out ${
                      isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    } text-[10px] sm:text-[12px] font-black ${brandVariants[brandIndex].fontClass} text-black leading-none uppercase`}
                  >
                    {brandVariants[brandIndex].text}
                  </span>
                </div>
              </Link>
            </div>

            {/* RIGHT SECTION: Profile + Cart */}
            <div className="flex items-center justify-end flex-1 gap-2 sm:gap-6">
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`p-2 rounded-full transition-all focus:outline-none ${
                    isProfileOpen ? "bg-amber-50 text-amber-900" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-2xl shadow-2xl py-2 z-[110] animate-in fade-in zoom-in-95">
                    {user ? (
                      <>
                        <div className="px-5 py-4 border-b border-gray-50 mb-1 bg-gray-50/50">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Account</p>
                          <p className="text-sm font-bold text-gray-900 truncate capitalize">{userName}</p>
                        </div>
                        <Link href="/profile" onClick={() => setIsProfileOpen(false)} className="block px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">My Profile</Link>
                        <Link href="/orders" onClick={() => setIsProfileOpen(false)} className="block px-5 py-3 text-sm font-semibold text-gray-800 hover:bg-amber-50 transition-colors">My Orders</Link>
                        {isAdmin && <Link href="/admin" onClick={() => setIsProfileOpen(false)} className="block px-5 py-3 text-sm font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors">Admin Dashboard</Link>}
                        <div className="border-t border-gray-50 mt-1">
                          <button onClick={handleLogout} className="w-full text-left px-5 py-3 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors">Logout</button>
                        </div>
                      </>
                    ) : (
                      <div className="p-4">
                        <Link href="/login" onClick={() => setIsProfileOpen(false)} className="block w-full text-center px-4 py-3.5 text-sm font-bold text-white bg-amber-900 rounded-xl hover:bg-black transition-all shadow-md active:scale-95">
                          Login / Sign Up
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Link
                href="/cart"
                className="relative group p-2 text-gray-700 hover:bg-gray-100 rounded-full transition-all"
                aria-label="Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                <span className="absolute top-1 right-1 bg-amber-900 text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm group-hover:scale-110 transition-transform">
                  {cartCount}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* FIXED: Mobile Location Bar (Pehle Jaisa) */}
      <div className="md:hidden fixed top-[72px] left-0 w-full z-[99] bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 px-5 shadow-sm">
        <LocationBox compact />
      </div>

      {/* FIXED: Spacer Heights (Pehle Jaisa) */}
      <div className="md:hidden h-[124px]" />
      <div className="hidden md:block h-[84px]" />
    </>
  );
}