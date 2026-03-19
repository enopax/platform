import type { Resource, ResourceType, ResourceStatus, ProjectResource } from '../types';

export interface CreateResourceData {
  name: string;
  description?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  configuration?: unknown;
  endpoint?: string;
  credentials?: unknown;
  ownerId: string;
  organisationId: string;
  tags?: string[];
}

export interface UpdateResourceData {
  name?: string;
  description?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  configuration?: unknown;
  endpoint?: string;
  credentials?: unknown;
  quotaLimit?: bigint;
  currentUsage?: bigint;
  isPublic?: boolean;
  tags?: string[];
  isActive?: boolean;
  deletedAt?: Date;
}

export interface IResourceRepository {
  create(data: CreateResourceData): Promise<Resource>;
  findById(id: string): Promise<Resource | null>;
  findByOrgId(organisationId: string): Promise<Resource[]>;
  findByOwnerId(ownerId: string): Promise<Resource[]>;
  findByStatus(status: ResourceStatus): Promise<Resource[]>;
  update(id: string, data: UpdateResourceData): Promise<Resource>;
  delete(id: string): Promise<void>;
  search(query: string, limit?: number): Promise<Resource[]>;
}

export interface IProjectResourceRepository {
  create(data: { projectId: string; resourceId: string; allocatedBy: string; quotaLimit?: bigint }): Promise<ProjectResource>;
  findByProjectId(projectId: string): Promise<ProjectResource[]>;
  findByResourceId(resourceId: string): Promise<ProjectResource[]>;
  delete(projectId: string, resourceId: string): Promise<void>;
}
