// lib/store/useCartStore.ts
import { create } from "zustand";

export type CartItem = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;  // ✅ added image_url
  };
};

interface CartState {
  isOpen: boolean;
  items: CartItem[];
  loading: boolean;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: () => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQty: (id: string, quantity: number) => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  isOpen: false,
  items: [],
  loading: false,

  openCart: () => {
    set({ isOpen: true });
    get().fetchCart();
  },

  closeCart: () => set({ isOpen: false }),

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/cart");
      if (res.ok) {
        const json = await res.json();
        // Ensure each product has image_url (fallback if missing)
        const itemsWithImage = (json.data || []).map((item: CartItem) => ({
          ...item,
          products: {
            ...item.products,
            image_url: item.products?.image_url || "/fallback-image.png",
          },
        }));
        set({ items: itemsWithImage });
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      set({ loading: false });
    }
  },

  removeItem: async (id: string) => {
    const prevItems = get().items;
    set({ items: prevItems.filter((i) => i.id !== id) });
    try {
      await fetch(`/api/cart/${id}`, { method: "DELETE" });
    } catch (error) {
      set({ items: prevItems });
    }
  },

  updateQty: async (id: string, quantity: number) => {
    if (quantity < 1) return get().removeItem(id);
    const prevItems = get().items;
    set({ items: prevItems.map((i) => (i.id === id ? { ...i, quantity } : i)) });
    try {
      await fetch(`/api/cart/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
    } catch (error) {
      set({ items: prevItems });
    }
  },
}));