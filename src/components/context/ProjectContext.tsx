'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Project } from '@prisma/client';

type ProjectContextType = {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('selectedProjectId');
    if (saved && projects.length > 0) {
      const project = projects.find(p => p.id === saved);
      if (project) {
        setSelectedProject(project);
      }
    }
  }, [projects]);

  // Save to localStorage when selection changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.id);
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProject]);

  return (
    <ProjectContext.Provider value={{
      selectedProject,
      setSelectedProject,
      projects,
      setProjects,
      isLoading,
      setIsLoading
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}