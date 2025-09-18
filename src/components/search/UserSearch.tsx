'use client'

import type { User } from '@prisma/client';
import GenericSearch, { type GenericSearchProps } from '@/components/GenericSearch';
import { findUsers } from '@/actions/user';

// Extend User to ensure it has the required id field for GenericSearch
interface SearchableUser extends User {
  id: string;
}

interface UserSearchProps extends Omit<GenericSearchProps<SearchableUser>, 'searchFunction' | 'getDisplayName' | 'getSecondaryText' | 'getBadgeText' | 'getBadgeVariant'> {
  placeholder?: string;
  defaultValue?: SearchableUser | null;
  setResult: (value: SearchableUser) => void;
}

export default function UserSearch({
  placeholder = 'Search users by name or email...',
  ...props
}: UserSearchProps) {
  const getDisplayName = (user: SearchableUser): string => {
    return user.name || 
           (user.firstname && user.lastname ? `${user.firstname} ${user.lastname}` : 
            user.firstname || user.lastname || user.email);
  };

  const getSecondaryText = (user: SearchableUser): string | null => {
    const displayName = getDisplayName(user);
    // Show email if it's different from the display name
    return user.email && user.email !== displayName ? user.email : null;
  };

  const getBadgeText = (): string => {
    return 'User';
  };

  const getBadgeVariant = (): 'default' => {
    return 'default';
  };

  const searchFunction = async (query: string): Promise<SearchableUser[]> => {
    const results = await findUsers(query);
    // Ensure all results have the required id field
    return results.map(user => ({ ...user, id: user.id }));
  };

  return (
    <GenericSearch<SearchableUser>
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