'use client';

import React, { createContext, useContext } from 'react';

export interface ProjectContextType {
  id: string;
  name: string;
  description: string | null;
  organisationId: string;
  isActive: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(
  undefined
);

export function ProjectProvider({
  children,
  project,
}: {
  children: React.ReactNode;
  project: ProjectContextType;
}) {
  return (
    <ProjectContext.Provider value={project}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextType {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
}
