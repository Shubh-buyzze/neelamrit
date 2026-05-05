import { useState, useEffect, useCallback } from "react";

// VAPID keys generate karne ki zarurat nahi — simple notifications ke liye
// Hum Supabase Realtime + local notification use karenge

export type NotificationPermission = "default" | "granted" | "denied";

export function usePushNotification() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setIsSupported(true);
      setPermission(Notification.permission as NotificationPermission);
    }
  }, []);

  // Permission maango
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    const result = await Notification.requestPermission();
    setPermission(result as NotificationPermission);
    return result === "granted";
  }, [isSupported]);

  // Notification dikhao
  const showNotification = useCallback(
    (title: string, options?: NotificationOptions & { url?: string }) => {
      if (permission !== "granted") return;

      const notification = new Notification(title, {
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        ...options,
      });

      // Click pe order page pe le jao
      notification.onclick = () => {
        window.focus();
        if (options?.url) {
          window.location.href = options.url;
        }
        notification.close();
      };

      // 5 second mein auto close
      setTimeout(() => notification.close(), 5000);
    },
    [permission]
  );

  return { permission, isSupported, requestPermission, showNotification };
}