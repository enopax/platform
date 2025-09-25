'use client';

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/common/Select';
import { type Team, type User, type Organisation } from '@prisma/client';

type TeamWithDetails = Team & {
  owner: User;
  organisation?: Organisation | null;
  _count: {
    members: number;
    projects: number;
  };
};

interface TeamFilterProps {
  teams: TeamWithDetails[];
  selectedTeamId: string | null;
  totalProjects: number;
}

export default function TeamFilter({ teams, selectedTeamId, totalProjects }: TeamFilterProps) {
  const router = useRouter();

  const handleTeamChange = (value: string) => {
    if (value === 'all') {
      router.push('/main/projects');
    } else {
      router.push(`/main/projects?team=${value}`);
    }
  };

  return (
    <div className="w-full sm:w-80">
      <Select value={selectedTeamId || teams[0].id} onValueChange={handleTeamChange}>
        <SelectTrigger>
          <SelectValue placeholder="Filter by team" />
        </SelectTrigger>
        <SelectContent>
          {teams.map((team) => (
            <SelectItem key={team.id} value={team.id}>
              {team.name} {team.isPersonal ? '(Personal)' : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}