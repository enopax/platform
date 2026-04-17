import type { ProjectAccess, ProjectRole } from '../types';

export interface GrantProjectAccessData {
  projectId: string;
  teamId: string;
  role: ProjectRole;
  grantedBy: string;
}

export interface IProjectAccessRepository {
  grant(data: GrantProjectAccessData): Promise<ProjectAccess>;
  findById(id: string): Promise<ProjectAccess | null>;
  findByProjectId(projectId: string): Promise<ProjectAccess[]>;
  findByTeamId(teamId: string): Promise<ProjectAccess[]>;
  findByProjectAndTeam(projectId: string, teamId: string): Promise<ProjectAccess | null>;
  updateRole(id: string, role: ProjectRole): Promise<ProjectAccess>;
  revoke(id: string): Promise<void>;
  revokeAllForTeam(teamId: string): Promise<void>;
  revokeAllForProject(projectId: string): Promise<void>;
}
