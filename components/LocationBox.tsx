// components/LocationBox.tsx
"use client";

import { useState, useEffect } from "react";

// ─── Types ───────────────────────────────────────────────
export type Location = {
  name: string;      // city/town/village
  district: string;
  state: string;
  pincode: string;
  fullAddress?: string; // optional: road + area + city
};

type Props = {
  onSelect?: (loc: Location) => void;
  compact?: boolean;
};

// ─── Helper: Format Full Location String ───────────────
function formatFullLocation(loc: Location): string {
  const parts = [];
  if (loc.fullAddress) {
    parts.push(loc.fullAddress);
  } else {
    parts.push(loc.name);
  }
  
  if (loc.district && loc.district !== loc.name) {
    parts.push(loc.district);
  }
  
  if (loc.state) {
    parts.push(loc.state);
  }

  const addressString = parts.join(", ");
  return `${addressString} - ${loc.pincode}`;
}

// ─── Component ──────────────────────────────────────────
export default function LocationBox({ onSelect, compact = false }: Props) {
  const [selected, setSelected] = useState<Location | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gpsError, setGpsError] = useState("");

  // Load saved location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("neelamrit_location");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSelected(parsed);
      } catch {}
    }
  }, []);

  // GPS detection – Kept exactly as it was
  async function detectGPS() {
    setGpsStatus("loading");
    setGpsError("");

    if (!navigator.geolocation) {
      setGpsError("Geolocation not supported");
      setGpsStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&zoom=18`,
            { headers: { "Accept-Language": "en", "User-Agent": "Neelamrit/1.0" } }
          );
          const data = await res.json();
          const addr = data.address;

          // Extract all possible fields
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
          const district = addr.county || addr.state_district || addr.district || city;
          const state = addr.state || "";
          const pincode = addr.postcode || "";
          const road = addr.road || "";
          const neighbourhood = addr.neighbourhood || addr.suburb || "";

          let fullAddress = "";
          if (road) fullAddress += road;
          if (neighbourhood && neighbourhood !== road) {
            if (fullAddress) fullAddress += ", ";
            fullAddress += neighbourhood;
          }
          if (city && city !== neighbourhood && city !== road) {
            if (fullAddress) fullAddress += ", ";
            fullAddress += city;
          }

          const loc: Location = {
            name: city || district || "Location",
            district,
            state,
            pincode,
            fullAddress: fullAddress || undefined,
          };

          handleSelect(loc);
          setGpsStatus("success");
        } catch (err) {
          console.error(err);
          setGpsError("Could not fetch address. Please try again.");
          setGpsStatus("error");
        }
      },
      (err) => {
        setGpsStatus("error");
        if (err.code === 1) setGpsError("Permission denied. Allow location access.");
        else if (err.code === 2) setGpsError("Location unavailable.");
        else setGpsError("Request timed out. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function handleSelect(loc: Location) {
    setSelected(loc);
    localStorage.setItem("neelamrit_location", JSON.stringify(loc));
    setShowPopup(false);
    onSelect?.(loc);
  }

  function handleClear() {
    setSelected(null);
    localStorage.removeItem("neelamrit_location");
    setGpsStatus("idle");
  }

  // ── Custom SVG Location Icon ──
  const LocationIcon = () => (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  // ── COMPACT MODE (navbar / mobile bar) ──
  if (compact) {
    return (
      <div className="relative w-full">
        <button
          onClick={() => setShowPopup(!showPopup)}
          className="flex items-center gap-2 w-full text-left focus:outline-none group"
        >
          <div className="text-amber-800 transition-transform group-hover:scale-110 flex-shrink-0">
            <LocationIcon />
          </div>
          
          <div className="flex flex-col overflow-hidden flex-1">
            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter leading-none mb-0.5">
              Delivering to
            </span>
            <span className="text-[12px] sm:text-sm font-bold text-gray-900 truncate w-full group-hover:text-amber-800 transition-colors">
              {selected ? formatFullLocation(selected) : "Detect your location"}
            </span>
          </div>

          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showPopup && (
          <div className="absolute top-full left-0 mt-3 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white border border-gray-100 rounded-2xl shadow-2xl z-[1000] p-4 animate-in fade-in zoom-in-95">
            <LocationBoxInner
              selected={selected}
              gpsStatus={gpsStatus}
              gpsError={gpsError}
              detectGPS={detectGPS}
              handleClear={handleClear}
            />
          </div>
        )}
      </div>
    );
  }

  // ── FULL MODE (profile page) ──
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5 w-full">
      <LocationBoxInner
        selected={selected}
        gpsStatus={gpsStatus}
        gpsError={gpsError}
        detectGPS={detectGPS}
        handleClear={handleClear}
      />
    </div>
  );
}

// ─── Shared Inner UI ────────────────────────────────────
function LocationBoxInner({
  selected, gpsStatus, gpsError, detectGPS, handleClear
}: any) {
  return (
    <div>
      {/* Selected location display inside dropdown */}
      {selected && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-4 flex justify-between items-start">
          <div>
            <p className="font-bold text-sm text-emerald-900 mb-1">
              {selected.fullAddress ? `${selected.fullAddress}, ${selected.name}` : selected.name}
            </p>
            <p className="text-xs text-emerald-700 font-medium">
              {selected.district && selected.district !== selected.name ? `${selected.district}, ` : ''}
              {selected.state} - {selected.pincode}
            </p>
          </div>
          <button onClick={handleClear} className="text-emerald-700 text-xs underline font-bold hover:text-emerald-900 transition-colors">
            Clear
          </button>
        </div>
      )}

      {/* GPS Button */}
      <button
        onClick={detectGPS}
        disabled={gpsStatus === "loading"}
        className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 transition-all text-sm font-bold tracking-wide ${
          gpsStatus === "loading"
            ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-sm"
        }`}
      >
        {gpsStatus === "loading" ? (
          <><span className="animate-spin">⏳</span> Detecting...</>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            Use My Current Location
          </>
        )}
      </button>

      {gpsStatus === "error" && gpsError && (
        <p className="text-xs text-red-600 bg-red-50 p-3 rounded-lg mt-3 font-medium">
          ⚠️ {gpsError}
        </p>
      )}
    </div>
  );
}