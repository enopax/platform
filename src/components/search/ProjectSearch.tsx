'use client'

import type { Project, ProjectStatus, ProjectPriority } from '@prisma/client';
import GenericSearch, { type GenericSearchProps } from '@/components/GenericSearch';
import { findProjects } from '@/actions/project';

// Extended Project type with search results
interface SearchableProject extends Project {
  id: string;
  organisation: {
    id: string;
    name: string;
  };
}

interface ProjectSearchProps extends Omit<GenericSearchProps<SearchableProject>, 'searchFunction' | 'getDisplayName' | 'getSecondaryText' | 'getBadgeText' | 'getBadgeVariant'> {
  placeholder?: string;
  defaultValue?: SearchableProject | null;
  setResult: (value: SearchableProject) => void;
}

export default function ProjectSearch({
  placeholder = 'Search projects by name or description...',
  ...props
}: ProjectSearchProps) {
  const getDisplayName = (project: SearchableProject): string => {
    return project.name;
  };

  const getSecondaryText = (project: SearchableProject): string | null => {
    if (project.description) {
      return project.description.length > 60
        ? `${project.description.substring(0, 60)}...`
        : project.description;
    }
    return project.organisation.name;
  };

  const getBadgeText = (project: SearchableProject): string => {
    const status = project.status.toLowerCase().replace('_', ' ');
    return `${status} • ${project.progress}%`;
  };

  const getBadgeVariant = (project: SearchableProject): 'secondary' | 'default' | 'outline' => {
    switch (project.status) {
      case 'ACTIVE': return 'default';
      case 'COMPLETED': return 'secondary';
      default: return 'outline';
    }
  };

  const searchFunction = async (query: string): Promise<SearchableProject[]> => {
    const results = await findProjects(query);
    // Ensure all results have the required id field and proper typing
    return results.map(project => ({ ...project, id: project.id })) as SearchableProject[];
  };

  return (
    <GenericSearch<SearchableProject>
      placeholder={placeholder}
      searchFunction={searchFunction}
      getDisplayName={getDisplayName}
      getSecondaryText={getSecondaryText}
      getBadgeText={getBadgeText}
      getBadgeVariant={getBadgeVariant}
      minSearchLength={2}
      debounceMs={300}
      {...props}
    />
  );
}