import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";

// ----- SVG Icons (neutral, professional) -----
const ShoppingBagIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 0 1-8 0" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M12 2v10" />
    <path d="M4 6h16" />
    <path d="M12 12l6-6" />
    <path d="M12 12l-6-6" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
    <path d="M10.29 3.86L2.34 18.29c-.73 1.27.22 2.71 1.71 2.71h15.9c1.49 0 2.44-1.44 1.71-2.71L13.71 3.86c-.73-1.27-2.69-1.27-3.42 0z" />
  </svg>
);

const PlusCircleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default async function AdminDashboard() {
  const supabase = await createServerSupabase();

  const [
    { count: totalOrders },
    { count: totalProducts },
    { count: lowStock },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("inventory").select("*", { count: "exact", head: true }).lte("quantity", 10),
  ]);

  return (
    <div className="p-6 md:p-8 lg:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-2">Welcome back. Here is the current status of your business.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-700">
                <ShoppingBagIcon />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Lifetime</span>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Total Orders</p>
            <p className="text-4xl font-extrabold text-gray-900">{totalOrders?.toLocaleString() || 0}</p>
            <div className="mt-4 h-1 w-12 bg-blue-200 rounded-full" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-700">
                <PackageIcon />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Store</span>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Active Products</p>
            <p className="text-4xl font-extrabold text-gray-900">{totalProducts?.toLocaleString() || 0}</p>
            <div className="mt-4 h-1 w-12 bg-amber-200 rounded-full" />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-red-50 rounded-bl-3xl opacity-50" />
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-50 rounded-xl text-red-600">
                <AlertTriangleIcon />
              </div>
              <span className="text-xs text-gray-400 uppercase tracking-wider">Critical</span>
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Low Stock Alerts</p>
            <p className="text-4xl font-extrabold text-red-600">{lowStock?.toLocaleString() || 0}</p>
            <div className="mt-4 h-1 w-12 bg-red-200 rounded-full" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-gray-900 rounded-full" />
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
            >
              <PlusCircleIcon />
              Add New Product
            </Link>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm"
            >
              <EyeIcon />
              View Pending Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}