// components/LeaderboardSection.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";
const supabase = createClient(supabaseUrl, supabaseKey);

interface TopBuyer {
  name: string;
  totalSpent: number;
  orderCount: number;
}

// 👑 Ranker Badge Component (Gold, Silver, Bronze)
const RankBadge = ({ rank }: { rank: number }) => {
  const colors = ["text-[#FFD700]", "text-[#C0C0C0]", "text-[#CD7F32]"];
  const bgColors = ["bg-[#FFD700]/10", "bg-[#C0C0C0]/10", "bg-[#CD7F32]/10"];
  const borderColors = ["border-[#FFD700]/30", "border-[#C0C0C0]/30", "border-[#CD7F32]/30"];

  return (
    <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-full ${bgColors[rank]} ${borderColors[rank]} border shadow-sm`}>
      <svg className={`w-6 h-6 drop-shadow-md ${colors[rank]}`} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M2.25 18V21H21.75V18H2.25ZM21.75 6.75L17.25 12L12 3L6.75 12L2.25 6.75V16.5H21.75V6.75Z" />
      </svg>
    </div>
  );
};

export default function LeaderboardSection() {
  const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        let finalData: TopBuyer[] = [];

        // 1. Try fetching via secure RPC (Recommended)
        const { data: rpcData, error: rpcError } = await supabase.rpc("get_alltime_leaderboard");

        if (!rpcError && rpcData && rpcData.length > 0) {
          finalData = rpcData.map((item: any) => ({
            name: item.name,
            totalSpent: Number(item.totalspent) || 0,
            orderCount: Number(item.ordercount) || 0
          }));
        } else {
          // 2. Fallback: Fetch directly from tables if RPC isn't available yet
          const { data: tableData, error: tableError } = await supabase
            .from("orders")
            .select(`total_amount, status, users_profile ( full_name )`)
            .neq("status", "cancelled");

          if (!tableError && tableData) {
            const userTotals: Record<string, TopBuyer> = {};
            tableData.forEach((order: any) => {
              const name = order.users_profile?.full_name;
              if (!name || name.trim() === "" || name === "Guest User" || name === "NULL" || order.status === "cancelled") return;

              const amount = parseFloat(order.total_amount) || 0;
              if (!userTotals[name]) {
                userTotals[name] = { name: name, totalSpent: 0, orderCount: 0 };
              }
              userTotals[name].totalSpent += amount;
              userTotals[name].orderCount += 1;
            });
            finalData = Object.values(userTotals);
          }
        }

        // Sort by total spent in descending order
        finalData.sort((a, b) => b.totalSpent - a.totalSpent);

        setTopBuyers(finalData);
      } catch (error) {
        console.error("Leaderboard Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  const top3Buyers = topBuyers.slice(0, 3);
  const otherBuyers = topBuyers.slice(3);

  return (
    <section className="py-20 bg-[#fdfaf6] border-b border-[#f0e8de] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-10">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dot-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#c8882a" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-pattern)" />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-[#1a0a02] mb-4">
            Become Top Buyer
          </h2>
          <p className="text-sm text-[#6b5a4a] mb-12 max-w-xl mx-auto">
            Order Fast and See Your Name On TOP  !!
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto mb-12">
          {loading ? (
            /* 🔥 SKELETON LOADING 🔥 */
            <div className="flex flex-col gap-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between px-6 py-5 rounded-2xl bg-white border border-[#f0e8de]/80 shadow-sm">
                  <div className="flex items-center gap-4 w-[45%] md:w-1/2">
                    <div className="w-10 h-10 rounded-full bg-[#f5efe6]"></div>
                    <div className="flex flex-col gap-2">
                      <div className="w-32 h-5 bg-[#f5efe6] rounded"></div>
                      <div className="w-16 h-3 bg-[#f5efe6] rounded"></div>
                    </div>
                  </div>
                  <div className="w-[25%] flex justify-center"><div className="w-16 h-3 bg-[#f5efe6] rounded"></div></div>
                  <div className="w-[30%] md:w-1/4 flex justify-end"><div className="w-20 h-6 bg-[#f5efe6] rounded"></div></div>
                </div>
              ))}
            </div>
          ) : topBuyers.length === 0 ? (
            <div className="py-10 text-[#9a8878] font-medium bg-white rounded-3xl border border-[#f0e8de] shadow-sm">
              No real orders found yet. Be the first to claim the top spot!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              
              {/* 👑 TOP 3 BUYERS (FIXED, NO SCROLL) 👑 */}
              <div className="space-y-3 relative z-20">
                {top3Buyers.map((buyer, index) => (
                  <motion.div 
                    key={`top-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-between px-6 py-4 rounded-2xl border ${
                      index === 0 ? "bg-gradient-to-r from-[#fffbf2] to-white border-[#c8882a]/40 shadow-[0_4px_20px_rgba(200,136,42,0.1)]" :
                      index === 1 ? "bg-gradient-to-r from-gray-50 to-white border-gray-300/60 shadow-sm" :
                      "bg-gradient-to-r from-orange-50/50 to-white border-orange-200/60 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-4 w-[45%] md:w-1/2">
                      <RankBadge rank={index} />
                      <div className="text-left overflow-hidden">
                        <p className={`font-serif font-bold truncate ${index === 0 ? "text-xl text-[#1a0a02]" : "text-lg text-[#1a0a02]"}`}>
                          {buyer.name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-[25%] text-center">
                      <p className="text-[10px] md:text-[11px] text-[#9a8878] uppercase tracking-wider font-bold">
                        {buyer.orderCount} Order(s)
                      </p>
                    </div>

                    <div className="w-[30%] md:w-1/4 text-right">
                      <p className={`font-serif font-bold ${index === 0 ? "text-2xl text-[#c8882a]" : "text-xl text-[#6b5a4a]"}`}>
                        ₹{buyer.totalSpent}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* 🔄 OTHER BUYERS (SEAMLESS INFINITE AUTO-SCROLL) 🔄 */}
              {otherBuyers.length > 0 && (
                <div className="relative h-[200px] overflow-hidden bg-white/50 border border-[#f0e8de] rounded-3xl shadow-inner mt-2">
                  <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-[#fdfaf6] to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#fdfaf6] to-transparent z-10 pointer-events-none"></div>

                  <div className="animate-vertical-scroll flex flex-col pt-2 w-full">
                    {[...otherBuyers, ...otherBuyers, ...otherBuyers].map((buyer, idx) => {
                      const actualRank = (idx % otherBuyers.length) + 4;
                      return (
                        <div key={`other-${idx}`} className="flex items-center justify-between px-6 py-3.5 mx-4 mb-3 rounded-2xl bg-white border border-[#f0e8de]/50 shrink-0 hover:bg-[#fcf9f5] transition-colors">
                          <div className="flex items-center gap-4 w-[45%] md:w-1/2">
                            <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-[#e8dece]/50 text-[#6b5a4a] font-bold text-xs">
                              #{actualRank}
                            </div>
                            <div className="text-left overflow-hidden">
                              <p className="font-serif font-semibold text-[15px] text-[#4a3a2a] truncate">{buyer.name}</p>
                            </div>
                          </div>
                          
                          <div className="w-[25%] text-center">
                            <p className="text-[9px] md:text-[10px] text-[#b0a090] uppercase tracking-wider font-semibold">
                              {buyer.orderCount} Order(s)
                            </p>
                          </div>

                          <div className="w-[30%] md:w-1/4 text-right">
                            <p className="font-serif font-bold text-lg text-[#6b5a4a]">₹{buyer.totalSpent}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <div className="flex justify-center mt-6">
            <Link 
              href="#collection-section" 
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('collection-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center h-14 px-12 bg-[#6b3e26] text-white rounded-full text-[13px] font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(107,62,38,0.5)] animate-pulse hover:animate-none hover:bg-[#522f1c] hover:scale-105 transition-all duration-300"
            >
              Order Now 
            </Link>
          </div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes verticalScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-33.33%); } 
        }
        .animate-vertical-scroll {
          animation: verticalScroll 20s linear infinite;
        }
        .animate-vertical-scroll:hover {
          animation-play-state: paused;
        }
      `}} />
    </section>
  );
}