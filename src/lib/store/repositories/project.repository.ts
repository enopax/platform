import type { Project, ProjectStatus, ProjectPriority } from '../types';

export interface CreateProjectData {
  name: string;
  description?: string;
  development?: boolean;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  repositoryUrl?: string;
  documentationUrl?: string;
  organisationId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  development?: boolean;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  progress?: number;
  repositoryUrl?: string;
  documentationUrl?: string;
  isActive?: boolean;
}

export interface ProjectWithFileCount extends Project {
  fileCount: number;
}

export interface IProjectRepository {
  create(data: CreateProjectData): Promise<Project>;
  findById(id: string): Promise<Project | null>;
  findByIdWithFileCount(id: string): Promise<ProjectWithFileCount | null>;
  findByNameAndOrg(name: string, organisationId: string): Promise<Project | null>;
  findByOrgId(organisationId: string, options?: { isActive?: boolean }): Promise<Project[]>;
  update(id: string, data: UpdateProjectData): Promise<Project>;
  search(query: string, limit?: number): Promise<Project[]>;
}
