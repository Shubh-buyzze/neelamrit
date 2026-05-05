import { useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { usePushNotification } from "./usePushNotification";

const STATUS_MESSAGES: Record<string, { title: string; body: string; emoji: string }> = {
  pending: {
    title: "Order Received! 🎉",
    body: "Your order has been placed successfully.",
    emoji: "🎉",
  },
  confirmed: {
    title: "Order Confirmed! ✅",
    body: "Your order has been confirmed and is being prepared.",
    emoji: "✅",
  },
  processing: {
    title: "Order Processing 🔄",
    body: "Your delicious sweets are being prepared with love!",
    emoji: "🔄",
  },
  shipped: {
    title: "Order Shipped! 🚚",
    body: "Your order is on the way. Get ready!",
    emoji: "🚚",
  },
  delivered: {
    title: "Order Delivered! 🍬",
    body: "Your Neelamrit order has been delivered. Enjoy!",
    emoji: "🍬",
  },
  cancelled: {
    title: "Order Cancelled ❌",
    body: "Your order has been cancelled.",
    emoji: "❌",
  },
};

export function useOrderTracking(userId?: string) {
  const { showNotification, permission } = usePushNotification();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!userId || permission !== "granted") return;

    // Browser client — realtime ke liye
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Realtime channel — orders table watch karo
    channelRef.current = supabase
      .channel(`orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // New order placed
          const order = payload.new;
          const msg = STATUS_MESSAGES["pending"];
          showNotification(msg.title, {
            body: `Order #${order.id.slice(0, 8).toUpperCase()} — ₹${order.total_amount}`,
            url: `/orders`,
            tag: `order-${order.id}`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // Order status changed
          const order = payload.new;
          const oldOrder = payload.old;

          // Sirf status change pe notify karo
          if (order.status === oldOrder.status) return;

          const msg = STATUS_MESSAGES[order.status];
          if (!msg) return;

          showNotification(msg.title, {
            body: `Order #${order.id.slice(0, 8).toUpperCase()} — ${msg.body}`,
            url: `/orders`,
            tag: `order-${order.id}-${order.status}`,
          });
        }
      )
      .subscribe();

    return () => {
      channelRef.current?.unsubscribe();
    };
  }, [userId, permission, showNotification]);
}