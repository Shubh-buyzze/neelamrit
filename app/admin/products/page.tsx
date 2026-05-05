"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string;
  name: string;
  price: number;
  description: string | null;
};

// ----- SVG Icons -----
const EditIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3l4 4-7 7H10v-4l7-7z" />
    <path d="M4 20h16" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 9v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9" />
    <line x1="10" y1="12" x2="10" y2="16" />
    <line x1="14" y1="12" x2="14" y2="16" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const PackageIcon = () => (
  <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
    <path d="M12 2v10" />
    <path d="M4 6h16" />
    <path d="M12 12l6-6" />
    <path d="M12 12l-6-6" />
  </svg>
);

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", description: "" });

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch("/api/admin/products");
      if (res.ok) {
        const json = await res.json();
        setProducts(json.data ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openAdd() {
    setEditingProduct(null);
    setForm({ name: "", price: "", description: "" });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm({ name: p.name, price: String(p.price), description: p.description ?? "" });
    setShowForm(true);
  }

  async function saveProduct() {
    if (!form.name || !form.price) return alert("Name and price are required");
    setSaving(true);

    const url = editingProduct
      ? `/api/admin/products/${editingProduct.id}`
      : "/api/admin/products";
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price),
          description: form.description || null,
        }),
      });

      const result = await res.json();

      if (result.success) {
        if (editingProduct) {
          setProducts((prev) =>
            prev.map((p) => (p.id === editingProduct.id ? result.data : p))
          );
        } else {
          setProducts((prev) => [result.data, ...prev]);
        }
        setShowForm(false);
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Network error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete product.");
      }
    } catch (err) {
      alert("Network error.");
    }
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products Catalog</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your sweets, pricing, and descriptions.</p>
        </div>
        {!showForm && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-sm"
          >
            <PlusIcon />
            Add New Product
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {editingProduct ? "Edit Product Details" : "Create New Product"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Premium Kaju Katli"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="e.g. 499"
                type="number"
                min="0"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">
                Description
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Write an appetizing description for your product..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-sm resize-y"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
            <button
              onClick={saveProduct}
              disabled={saving}
              className={`px-8 py-3 rounded-xl text-sm font-bold text-white transition-all ${
                saving ? "bg-amber-300 cursor-not-allowed" : "bg-amber-700 hover:bg-amber-800 shadow-md"
              }`}
            >
              {saving ? "Saving..." : editingProduct ? "Update Product" : "Publish Product"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Products Table */}
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-16 bg-gray-200 rounded-2xl w-full" />
          <div className="h-16 bg-gray-200 rounded-2xl w-full" />
          <div className="h-16 bg-gray-200 rounded-2xl w-full" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden md:table-cell">Description</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-gray-400">
                    <PackageIcon />
                    <p className="font-medium mt-2">No products found. Click "Add New Product" to start.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-700 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" />
                            <path d="M12 2v10" />
                            <path d="M4 6h16" />
                          </svg>
                        </div>
                        <span className="font-bold text-gray-900 text-sm">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg text-sm">
                        ₹{Number(p.price).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-5 hidden md:table-cell">
                      <p className="text-xs text-gray-500 truncate max-w-xs">
                        {p.description ?? <span className="italic text-gray-300">No description</span>}
                      </p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          onClick={() => deleteProduct(p.id)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                          title="Delete"
                        >
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}