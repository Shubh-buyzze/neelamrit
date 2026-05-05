// components/Toast.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type ToastProps = {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose?: () => void;
};

let toastId = 0;
// 🟢 FIX: Added 'remove?: boolean' to the listener type definition
const listeners: ((toast: ToastProps & { id: number; remove?: boolean }) => void)[] = [];

function notify(toast: ToastProps) {
  const id = toastId++;
  listeners.forEach((listener) => listener({ ...toast, id }));
  setTimeout(() => {
    listeners.forEach((listener) => listener({ ...toast, id, remove: true }));
  }, toast.duration || 3000);
}

export const toast = {
  success: (message: string, duration?: number) => notify({ message, type: "success", duration }),
  error: (message: string, duration?: number) => notify({ message, type: "error", duration }),
  info: (message: string, duration?: number) => notify({ message, type: "info", duration }),
};

export function ToastProvider() {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<(ToastProps & { id: number; remove?: boolean })[]>([]);

  useEffect(() => {
    setMounted(true);
    const handler = (newToast: ToastProps & { id: number; remove?: boolean }) => {
      if (newToast.remove) {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      } else {
        setToasts((prev) => [...prev, newToast]);
      }
    };
    listeners.push(handler);
    return () => {
      const index = listeners.indexOf(handler);
      if (index !== -1) listeners.splice(index, 1);
    };
  }, []);

  // Don't render anything on server
  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            pointer-events-auto px-5 py-3 rounded-xl shadow-lg backdrop-blur-md text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300
            ${toast.type === "success" ? "bg-green-600 text-white" : ""}
            ${toast.type === "error" ? "bg-red-600 text-white" : ""}
            ${toast.type === "info" ? "bg-blue-600 text-white" : ""}
            ${!toast.type ? "bg-gray-900 text-white" : ""}
          `}
        >
          {toast.type === "success" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {toast.type === "error" && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {toast.message}
        </div>
      ))}
    </div>,
    document.body
  );
}