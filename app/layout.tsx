// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script"; // 🟢 ADDED FOR TRUECALLER
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "NEELAMRIT – Traditional Indian Sweets",
  description: "Pure jaggery sweets, handcrafted with love.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#fafaf9] font-sans antialiased">
        {children}
        
        {/* 🟢 TRUECALLER SDK SCRIPT */}
        <Script 
          src="https://one-tap-sdk.truecaller.com/v1/sdk.js" 
          strategy="afterInteractive" 
        />
      </body>
    </html>
  );
}