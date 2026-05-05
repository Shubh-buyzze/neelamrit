import { useState, useEffect, useRef, useCallback } from "react";

type Town = [string, string, string, string]; // [name, district, state, pincodePrefix]

type SearchResult = {
  name: string;
  district: string;
  state: string;
  pincodePrefix: string;
};

let cachedData: Town[] | null = null;

async function loadLocationData(): Promise<Town[]> {
  if (cachedData) return cachedData;

  const res = await fetch("/data/location_data.json");
  const json = await res.json();
  cachedData = json.towns;
  return cachedData!;
}

export function useLocationSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 🟢 FIX: Added '| undefined' and passed '(undefined)' as initial value
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    const towns = await loadLocationData();
    const lower = q.toLowerCase().trim();

    // Priority search:
    // 1. Starts with query (highest priority)
    // 2. Contains query
    const startsWith: SearchResult[] = [];
    const contains: SearchResult[] = [];

    for (const town of towns) {
      const nameLower = town[0].toLowerCase();
      if (nameLower.startsWith(lower)) {
        startsWith.push({
          name: town[0],
          district: town[1],
          state: town[2],
          pincodePrefix: town[3],
        });
      } else if (nameLower.includes(lower)) {
        contains.push({
          name: town[0],
          district: town[1],
          state: town[2],
          pincodePrefix: town[3],
        });
      }
      // Stop at 20 results for performance
      if (startsWith.length >= 15 && contains.length >= 5) break;
    }

    setResults([...startsWith, ...contains].slice(0, 20));
    setLoading(false);
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 200); // 200ms debounce

    return () => clearTimeout(debounceRef.current);
  }, [query, search]);

  return { query, setQuery, results, loading };
}