import type { ProjectRoleDefinition, ProjectPermission } from '../types';

export interface CreateProjectRoleData {
  organisationId: string;
  name: string;
  description: string;
  permissions: ProjectPermission[];
  isBuiltIn?: boolean;
  rank: number;
}

export interface UpdateProjectRoleData {
  name?: string;
  description?: string;
  permissions?: ProjectPermission[];
  rank?: number;
}

export interface IProjectRoleRepository {
  create(data: CreateProjectRoleData): Promise<ProjectRoleDefinition>;
  findById(id: string): Promise<ProjectRoleDefinition | null>;
  findByOrgId(organisationId: string): Promise<ProjectRoleDefinition[]>;
  findByNameAndOrg(name: string, organisationId: string): Promise<ProjectRoleDefinition | null>;
  findBuiltInByOrg(organisationId: string): Promise<ProjectRoleDefinition[]>;
  update(id: string, data: UpdateProjectRoleData): Promise<ProjectRoleDefinition>;
  delete(id: string): Promise<void>;
}
