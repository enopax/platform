'use client';

import React, { createContext, useContext } from 'react';

export interface OrganisationContextType {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  isActive: boolean;
}

const OrganisationContext = createContext<OrganisationContextType | undefined>(
  undefined
);

export function OrganisationProvider({
  children,
  organisation,
}: {
  children: React.ReactNode;
  organisation: OrganisationContextType;
}) {
  return (
    <OrganisationContext.Provider value={organisation}>
      {children}
    </OrganisationContext.Provider>
  );
}

export function useOrganisation(): OrganisationContextType {
  const context = useContext(OrganisationContext);
  if (!context) {
    throw new Error('useOrganisation must be used within OrganisationProvider');
  }
  return context;
}
