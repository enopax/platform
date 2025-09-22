'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { type Team, type Organisation, type User } from '@prisma/client';

type TeamWithDetails = Team & {
  owner: User;
  organisation?: Organisation | null;
  _count: {
    members: number;
    projects: number;
  };
};

interface TeamSelectorProps {
  teams: TeamWithDetails[];
  selectedTeamId: string | null;
  onTeamChange: (teamId: string | null) => void;
}

export default function TeamSelector({ teams, selectedTeamId, onTeamChange }: TeamSelectorProps) {
  return (
    <div className="w-full sm:w-80">
      <Select value={selectedTeamId || teams[0].id} onValueChange={(value) => onTeamChange(value === 'all' ? null : value)}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} {team.isPersonal ? '(Personal)' : ''} ({team._count.projects} projects)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}