// components/LocationPicker.tsx
"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/lib/hooks/useLocation";

type Props = {
  onSelect: (location: {
    city: string;
    district: string;
    state: string;
    pincode: string;
  }) => void;
  initialValue?: string;
};

export default function LocationPicker({ onSelect, initialValue }: Props) {
  const { status, result, error, detect, reset } = useLocation();
  const [selectedLabel, setSelectedLabel] = useState(initialValue ?? "");

  useEffect(() => {
    if (status === "success" && result) {
      setSelectedLabel(`${result.city}, ${result.state}`);
      onSelect({
        city: result.city,
        district: result.district,
        state: result.state,
        pincode: result.pincode,
      });
    }
  }, [status, result]);

  const isLoading =
    status === "requesting" ||
    status === "locating" ||
    status === "geocoding";

  return (
    <div className="flex items-center">
      
      {/* GPS Detect Button - Small & Blue */}
      {status !== "success" && (
        <button
          type="button"
          onClick={detect}
          disabled={isLoading}
          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-bold rounded border transition-all ${
            isLoading 
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-sm focus:ring-1 focus:ring-blue-500"
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin w-3 h-3 text-current" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Locating...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>USE GPS</span>
            </>
          )}
        </button>
      )}

      {/* GPS Result (Compact) */}
      {status === "success" && result && (
        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-2 py-1 rounded shadow-sm">
          <span className="flex items-center gap-1 text-[9px] font-bold text-green-700 uppercase tracking-wide">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Fetched
          </span>
          <button 
            type="button" 
            onClick={reset} 
            className="text-[9px] font-bold text-gray-400 hover:text-gray-800 transition-colors ml-1"
            title="Reset Location"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {status === "error" && error && (
        <div className="absolute right-0 top-full mt-1 flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded text-[9px] font-bold shadow-sm whitespace-nowrap z-20">
          <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Failed
          <button type="button" onClick={reset} className="ml-1 text-gray-500 hover:text-gray-800">✕</button>
        </div>
      )}
    </div>
  );
}