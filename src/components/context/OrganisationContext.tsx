'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Organisation } from '@prisma/client';

type OrganisationContextType = {
  selectedOrganisation: Organisation | null;
  setSelectedOrganisation: (org: Organisation | null) => void;
  organisations: Organisation[];
  setOrganisations: (orgs: Organisation[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const OrganisationContext = createContext<OrganisationContextType | undefined>(undefined);

export function OrganisationProvider({ children }: { children: ReactNode }) {
  const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null);
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedOrganisationId');
    if (saved && organisations.length > 0) {
      const org = organisations.find(o => o.id === saved);
      if (org) {
        setSelectedOrganisation(org);
      }
    }
  }, [organisations]);

  // Save to localStorage when selection changes
  useEffect(() => {
    if (selectedOrganisation) {
      localStorage.setItem('selectedOrganisationId', selectedOrganisation.id);
    } else {
      localStorage.removeItem('selectedOrganisationId');
    }
  }, [selectedOrganisation]);

  return (
    <OrganisationContext.Provider value={{
      selectedOrganisation,
      setSelectedOrganisation,
      organisations,
      setOrganisations,
      isLoading,
      setIsLoading
    }}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation() {
  const context = useContext(OrganisationContext);
  if (context === undefined) {
    throw new Error('useOrganisation must be used within an OrganisationProvider');
  }
  return context;
}