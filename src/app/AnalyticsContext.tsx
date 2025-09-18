'use client'

import { createContext, useContext, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const AnalyticsContext = createContext<{ trackEvent: (event: string) => void } | null>(null);

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent('pageview');
  }, [pathname]);

  const trackEvent = async (event: string) => {
    try {
      await fetch('/api/tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          url: window.location.href,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        }),
      });
    } catch (error) {
      console.error('Failed to send analytics event:', error);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ trackEvent }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

// Custom hook to use Analytics
export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}
