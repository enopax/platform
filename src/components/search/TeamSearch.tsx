'use client';

import { useState } from 'react';
import GenericSearch from '@/components/GenericSearch';
import { findTeams } from '@/actions/team';
import { type Team, type Organisation, type User } from '@prisma/client';

type TeamWithDetails = Team & {
  owner: {
    name: string | null;
    firstname: string | null;
    lastname: string | null;
    email: string;
  };
  organisation: {
    name: string;
  };
};

interface TeamSearchProps {
  placeholder?: string;
  defaultValue?: TeamWithDetails | null;
  setResult: (team: TeamWithDetails | null) => void;
  name?: string;
  required?: boolean;
  hasError?: boolean;
}

export default function TeamSearch({
  placeholder = "Search teams...",
  defaultValue = null,
  setResult,
  name,
  required,
  hasError
}: TeamSearchProps) {
  const [selectedTeam, setSelectedTeam] = useState<TeamWithDetails | null>(defaultValue);

  const getDisplayName = (team: TeamWithDetails) => {
    return `${team.name} (${team.organisation.name})`;
  };


  const handleSelection = (team: TeamWithDetails | null) => {
    setSelectedTeam(team);
    setResult(team);
  };

  return (
    <>
      <GenericSearch<TeamWithDetails>
        searchFunction={findTeams}
        getDisplayName={getDisplayName}
        setResult={handleSelection}
        placeholder={placeholder}
        defaultValue={selectedTeam}
        hasError={hasError}
        getSecondaryText={(team) => team.organisation.name}
        getBadgeText={(team) => team.description || undefined}
      />
      {selectedTeam && name && (
        <input type="hidden" name={name} value={selectedTeam.id} />
      )}
      {required && !selectedTeam && (
        <input type="hidden" name={name} value="" required />
      )}
    </>
  );
}