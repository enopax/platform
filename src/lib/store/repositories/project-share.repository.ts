import type { ProjectShare, SharePermission, ShareStatus, ProjectOwnerType } from '../types';

export interface CreateProjectShareData {
  projectId: string;
  sharedWithType: ProjectOwnerType;
  sharedWithId: string;
  permission: SharePermission;
  sharedBy: string;
}

export interface IProjectShareRepository {
  create(data: CreateProjectShareData): Promise<ProjectShare>;
  findById(id: string): Promise<ProjectShare | null>;
  findByProjectId(projectId: string, status?: ShareStatus): Promise<ProjectShare[]>;
  findSharedWithEntity(entityType: ProjectOwnerType, entityId: string, status?: ShareStatus): Promise<ProjectShare[]>;
  findByProjectAndEntity(projectId: string, entityType: ProjectOwnerType, entityId: string): Promise<ProjectShare | null>;
  updatePermission(id: string, permission: SharePermission): Promise<ProjectShare>;
  updateStatus(id: string, status: ShareStatus): Promise<ProjectShare>;
  revoke(id: string): Promise<void>;
  revokeAllForProject(projectId: string): Promise<void>;
}
