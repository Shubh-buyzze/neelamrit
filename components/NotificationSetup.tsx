// components/NotificationSetup.tsx
"use client";

import { useEffect, useState } from "react";
import { usePushNotification } from "@/lib/hooks/usePushNotification";
import { useOrderTracking } from "@/lib/hooks/useOrderTracking";

type Props = {
  userId?: string;
};

export default function NotificationSetup({ userId }: Props) {
  const [mounted, setMounted] = useState(false);
  const { permission, isSupported, requestPermission, showNotification } =
    usePushNotification();
  const [showBanner, setShowBanner] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Order tracking — realtime listen karo
  useOrderTracking(userId);

  useEffect(() => {
    setMounted(true);
    if (!isSupported) return;

    if (permission === "granted") return;
    if (permission === "denied") return;

    const wasDismissed = localStorage.getItem("notif_dismissed");
    if (wasDismissed) return;

    const timer = setTimeout(() => setShowBanner(true), 3000);
    return () => clearTimeout(timer);
  }, [isSupported, permission]);

  async function handleEnable() {
    const granted = await requestPermission();
    setShowBanner(false);
    if (granted) {
      setTimeout(() => {
        showNotification("Notifications Enabled! 🎉", {
          body: "You'll now get updates about your Neelamrit orders.",
          url: "/orders",
        });
      }, 500);
    }
  }

  function handleDismiss() {
    setShowBanner(false);
    setDismissed(true);
    localStorage.setItem("notif_dismissed", "true");
  }

  // Don't render anything on server
  if (!mounted) return null;
  if (!isSupported || !showBanner || dismissed) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1f2937",
      color: "#fff",
      borderRadius: "12px",
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: "16px",
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      zIndex: 9999,
      maxWidth: "420px",
      width: "calc(100% - 48px)",
      animation: "slideUp 0.3s ease",
    }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
      `}</style>

      <span style={{ fontSize: "28px" }}>🔔</span>

      <div style={{ flex: 1 }}>
        <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: "14px" }}>
          Order Updates
        </p>
        <p style={{ margin: 0, fontSize: "12px", color: "#9ca3af" }}>
          Get notified when your order status changes
        </p>
      </div>

      <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
        <button
          onClick={handleEnable}
          style={{
            padding: "8px 16px",
            background: "#92400e",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Enable
        </button>
        <button
          onClick={handleDismiss}
          style={{
            padding: "8px 12px",
            background: "#374151",
            color: "#9ca3af",
            border: "none",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}