import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import AddToCartBtn from "@/components/AddToCartBtn";
import Link from "next/link";

export const dynamic = 'force-dynamic'

// 🚀 Professional SEO Optimization (For Google/WhatsApp sharing)
export async function generateMetadata(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabase();
  const { data: product } = await supabase
    .from("products")
    .select("name, description")
    .eq("id", params.id)
    .single();

  if (!product) return { title: "Product Not Found" };

  return {
    title: `${product.name} | Neelamrit Sweets`,
    description: product.description || `Buy delicious ${product.name} online from Neelamrit.`,
  };
}

export default async function ProductDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = await createServerSupabase();

  // ⚡ Direct Database Call (No API Latency)
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !product) {
    notFound(); // Redirects to Next.js 404 page beautifully
  }

  // Stock check
  const { data: inventory } = await supabase
    .from("inventory")
    .select("quantity")
    .eq("product_id", product.id)
    .single();

  const isOutOfStock = inventory?.quantity === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex text-sm text-gray-500 mb-8 font-medium">
          <Link href="/" className="hover:text-amber-800 transition">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/" className="hover:text-amber-800 transition">Sweets</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            
            {/* Left: Product Image Placeholder */}
            <div className="bg-amber-50 p-12 flex items-center justify-center min-h-[400px] border-b md:border-b-0 md:border-r border-amber-100">
              <div className="text-[120px] filter drop-shadow-xl hover:scale-110 transition-transform duration-500">
                🍬
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="p-8 lg:p-12 flex flex-col justify-center">
              
              <div className="mb-2">
                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Premium Quality
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-4 mb-6">
                <p className="text-4xl font-black text-amber-800">
                  ₹{product.price}
                </p>
                <p className="text-sm text-gray-500 mb-1 font-medium">(Inclusive of all taxes)</p>
              </div>

              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                {product.description || "Experience the authentic taste of traditional Indian sweets, made with pure desi ghee and premium ingredients. Perfect for gifting or treating yourself."}
              </p>

              <div className="border-t border-gray-100 pt-8 mt-auto">
                {isOutOfStock ? (
                  <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-bold border border-red-100">
                    Out of Stock currently. Please check back later!
                  </div>
                ) : (
                  <AddToCartBtn productId={product.id} />
                )}
                
                <div className="mt-6 flex gap-6 text-sm font-medium text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🚚</span> Fast Delivery
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌿</span> 100% Pure
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🛡️</span> Secure Payment
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}