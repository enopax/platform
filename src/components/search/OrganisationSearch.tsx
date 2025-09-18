'use client'

import type { Organisation } from '@prisma/client';
import GenericSearch, { type GenericSearchProps } from '@/components/GenericSearch';
import { findOrganisations } from '@/actions/organisation';

// Extended Organisation type with search results
interface SearchableOrganisation extends Organisation {
  id: string;
  owner: {
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  _count: {
    members: number;
    teams: number;
    projects: number;
  };
}

interface OrganisationSearchProps extends Omit<GenericSearchProps<SearchableOrganisation>, 'searchFunction' | 'getDisplayName' | 'getSecondaryText' | 'getBadgeText' | 'getBadgeVariant'> {
  placeholder?: string;
  defaultValue?: SearchableOrganisation | null;
  setResult: (value: SearchableOrganisation) => void;
}

export default function OrganisationSearch({
  placeholder = 'Search organisations by name...',
  ...props
}: OrganisationSearchProps) {
  const getDisplayName = (organisation: SearchableOrganisation): string => {
    return organisation.name;
  };

  const getSecondaryText = (organisation: SearchableOrganisation): string | null => {
    if (organisation.description) {
      return organisation.description.length > 60 
        ? `${organisation.description.substring(0, 60)}...` 
        : organisation.description;
    }
    const ownerName = organisation.owner.name || 
                     (organisation.owner.firstname && organisation.owner.lastname 
                       ? `${organisation.owner.firstname} ${organisation.owner.lastname}` 
                       : organisation.owner.email);
    return `Owner: ${ownerName}`;
  };

  const getBadgeText = (organisation: SearchableOrganisation): string => {
    const { members, teams, projects } = organisation._count;
    if (members > 1) return `${members} members`;
    if (teams > 0) return `${teams} teams`;
    if (projects > 0) return `${projects} projects`;
    return 'Organisation';
  };

  const getBadgeVariant = (): 'secondary' => {
    return 'secondary';
  };

  const searchFunction = async (query: string): Promise<SearchableOrganisation[]> => {
    const results = await findOrganisations(query);
    // Ensure all results have the required id field and proper typing
    return results.map(org => ({ ...org, id: org.id })) as SearchableOrganisation[];
  };

  return (
    <GenericSearch<SearchableOrganisation>
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