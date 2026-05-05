import { useState, useCallback } from "react";

export type LocationResult = {
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  accuracy: number;
  source: "gps" | "manual";
};

export type LocationStatus =
  | "idle"
  | "requesting"
  | "locating"
  | "geocoding"
  | "success"
  | "error";

export function useLocation() {
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    setStatus("requesting");
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setStatus("error");
      return;
    }

    // High accuracy GPS request
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setStatus("geocoding");

        const { latitude, longitude, accuracy } = position.coords;

        try {
          // Nominatim reverse geocoding — free, no API key
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
                "User-Agent": "Neelamrit-eCommerce/1.0",
              },
            }
          );

          if (!res.ok) throw new Error("Geocoding failed");

          const data = await res.json();
          const addr = data.address;

          // Extract fields from Nominatim response
          const city =
            addr.city ||
            addr.town ||
            addr.village ||
            addr.suburb ||
            addr.county ||
            "";

          const district =
            addr.county ||
            addr.state_district ||
            addr.district ||
            city;

          const state = addr.state || "";
          const pincode = addr.postcode || "";

          setResult({
            city,
            district,
            state,
            pincode,
            lat: latitude,
            lng: longitude,
            accuracy: Math.round(accuracy),
            source: "gps",
          });

          setStatus("success");
        } catch (err) {
          setError("Could not fetch address. Please enter manually.");
          setStatus("error");
        }
      },
      (err) => {
        setStatus("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError("Location permission denied. Please allow access.");
            break;
          case err.POSITION_UNAVAILABLE:
            setError("Location unavailable. Please enter manually.");
            break;
          case err.TIMEOUT:
            setError("Location request timed out. Try again.");
            break;
          default:
            setError("Unknown error occurred.");
        }
      },
      {
        enableHighAccuracy: true,  // GPS use karo, not just WiFi
        timeout: 15000,            // 15 seconds wait
        maximumAge: 0,             // Cache use mat karo — fresh location lo
      }
    );
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, detect, reset };
}