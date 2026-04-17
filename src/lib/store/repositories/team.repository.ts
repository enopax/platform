import type { Team, TeamMember, ProjectRole } from '../types';

export interface CreateTeamData {
  organisationId: string;
  name: string;
  description?: string;
  defaultProjectRole: ProjectRole;
}

export interface UpdateTeamData {
  name?: string;
  description?: string;
  defaultProjectRole?: ProjectRole;
}

export interface AddTeamMemberData {
  teamId: string;
  userId: string;
  addedBy: string;
}

export interface ITeamRepository {
  create(data: CreateTeamData): Promise<Team>;
  findById(id: string): Promise<Team | null>;
  findByOrgId(organisationId: string): Promise<Team[]>;
  findByNameAndOrg(name: string, organisationId: string): Promise<Team | null>;
  update(id: string, data: UpdateTeamData): Promise<Team>;
  delete(id: string): Promise<void>;
}

export interface ITeamMemberRepository {
  add(data: AddTeamMemberData): Promise<TeamMember>;
  findByTeamId(teamId: string): Promise<TeamMember[]>;
  findByUserId(userId: string): Promise<TeamMember[]>;
  findByTeamAndUser(teamId: string, userId: string): Promise<TeamMember | null>;
  remove(teamId: string, userId: string): Promise<void>;
  removeAllForUser(userId: string): Promise<void>;
  removeAllForTeam(teamId: string): Promise<void>;
}
