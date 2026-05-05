// components/AdminNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ----- SVG Icons (clean, no emojis) -----
const DashboardIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const OrdersIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M12 2v10" />
    <path d="M4 6h16" />
    <path d="M12 12l6-6" />
    <path d="M12 12l-6-6" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="21" x2="9" y2="9" />
  </svg>
);

const navItems = [
  { name: "Dashboard", href: "/admin", icon: DashboardIcon },
  { name: "Orders", href: "/admin/orders", icon: OrdersIcon },
  { name: "Products", href: "/admin/products", icon: ProductsIcon },
  { name: "Inventory", href: "/admin/inventory", icon: InventoryIcon },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="sticky top-0 z-50 backdrop-blur-md bg-white/70 shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Centered Title */}
        <div className="text-center mb-4">
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-wide text-gray-900">
            NEELAMRIT <span className="text-amber-700 text-sm md:text-base font-sans">Admin</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">Secure Admin Workspace</p>
        </div>

        {/* Horizontal Buttons – wrap on mobile */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 shadow-sm"
                    : "bg-white/50 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}