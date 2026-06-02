// app/layout.tsx
import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  metadataBase: new URL("https://neelamrit.in"),
  title: {
    default: "NEELAMRIT – Traditional Indian Sweets | 100% Pure Jaggery",
    template: "%s | NEELAMRIT",
  },
  description: "Experience authentic Lakadwa sweets made with 100% pure jaggery, desi ghee, and zero refined sugar. 12-hour express delivery in Varanasi.",
  keywords: ["Indian sweets", "jaggery sweets", "Lakadwa", "Varanasi sweets", "healthy sweets", "pure desi ghee sweets", "Neelamrit sweets"],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "NEELAMRIT – Traditional Indian Sweets",
    description: "Pure jaggery sweets, handcrafted with love.",
    url: "https://neelamrit.in",
    siteName: "Neelamrit",
    images: [
      {
        url: "/banner.webp",
        width: 1200,
        height: 630,
        alt: "Neelamrit Traditional Sweets",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NEELAMRIT – Traditional Indian Sweets",
    description: "Pure jaggery sweets, handcrafted with love.",
    images: ["/banner.webp"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Structured Data (JSON-LD) for Rich Google Search Results
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "NEELAMRIT",
    "image": "https://neelamrit.in/banner.webp",
    "description": "Traditional Indian Sweets made with pure jaggery.",
    "priceRange": "₹₹",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Mughalsarai, Chandauli",
      "addressRegion": "Uttar Pradesh",
      "postalCode": "221008",
      "addressCountry": "IN"
    },
    "telephone": "+919305158543",
    "url": "https://neelamrit.in"
  };

  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-[#fafaf9] font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}