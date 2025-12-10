'use client';

import React, { createContext, useContext } from 'react';

export interface ResourceContextType {
  id: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  endpoint: string | null;
  organisationId: string;
  ownerId: string;
}

const ResourceContext = createContext<ResourceContextType | undefined>(
  undefined
);

export function ResourceProvider({
  children,
  resource,
}: {
  children: React.ReactNode;
  resource: ResourceContextType;
}) {
  return (
    <ResourceContext.Provider value={resource}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResource(): ResourceContextType {
  const context = useContext(ResourceContext);
  if (!context) {
    throw new Error('useResource must be used within ResourceProvider');
  }
  return context;
}
