'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

interface PremiumOverlayContextValue {
  isOpen: boolean;
  openPremium: () => void;
  closePremium: () => void;
}

const PremiumOverlayContext = createContext<PremiumOverlayContextValue | null>(
  null
);

export function PremiumOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openPremium = useCallback(() => setIsOpen(true), []);
  const closePremium = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ isOpen, openPremium, closePremium }),
    [isOpen, openPremium, closePremium]
  );

  return (
    <PremiumOverlayContext.Provider value={value}>
      {children}
    </PremiumOverlayContext.Provider>
  );
}

export function usePremiumOverlay(): PremiumOverlayContextValue {
  const context = useContext(PremiumOverlayContext);
  if (!context) {
    throw new Error('usePremiumOverlay must be used within PremiumOverlayProvider');
  }
  return context;
}
