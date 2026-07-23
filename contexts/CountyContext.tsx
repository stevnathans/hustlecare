'use client';
// contexts/CountyContext.tsx
//
// Holds the list of counties and the person's current selection for a
// business page. Selection persists per-business in localStorage so it's
// remembered across a browsing session (per the "remember the user's
// selection while browsing the business" requirement).

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { County } from '@/types';

type CountyContextType = {
  counties: County[];
  selectedCounty: County | null;
  setSelectedCounty: (county: County | null) => void;
  loading: boolean;
};

const CountyContext = createContext<CountyContextType>({
  counties: [],
  selectedCounty: null,
  setSelectedCounty: () => {},
  loading: false,
});

export function CountyProvider({ children, businessSlug }: { children: ReactNode; businessSlug: string }) {
  const [counties, setCounties] = useState<County[]>([]);
  const [selectedCounty, setSelectedCountyState] = useState<County | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/counties')
      .then((r) => r.json())
      .then((data) => setCounties(Array.isArray(data) ? data : []))
      .catch(() => setCounties([]))
      .finally(() => setLoading(false));
  }, []);

  // Restore a persisted selection once counties are loaded.
  useEffect(() => {
    if (counties.length === 0) return;
    const stored = localStorage.getItem(`hc_county_${businessSlug}`);
    if (stored) {
      const match = counties.find((c) => c.slug === stored);
      if (match) setSelectedCountyState(match);
    }
  }, [counties, businessSlug]);

  const setSelectedCounty = (county: County | null) => {
    setSelectedCountyState(county);
    if (county) localStorage.setItem(`hc_county_${businessSlug}`, county.slug);
    else localStorage.removeItem(`hc_county_${businessSlug}`);
  };

  return (
    <CountyContext.Provider value={{ counties, selectedCounty, setSelectedCounty, loading }}>
      {children}
    </CountyContext.Provider>
  );
}

export const useCounty = () => useContext(CountyContext);