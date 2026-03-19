import { getStoreAsync } from '@/lib/store';
import type { Project, ProjectStatus, ProjectPriority } from '@/lib/store';
import type { CreateProjectData, UpdateProjectData } from '@/lib/store/repositories/project.repository';
import { organisationService } from './organisation';
import { validateNameFormat } from '../name-validation';

export type { CreateProjectData, UpdateProjectData };

export interface ProjectInfo extends Project {
  organisation?: {
    id: string;
    name: string;
  };
  fileCount?: number;
}

export class ProjectService {
  async createProject(userId: string, data: CreateProjectData): Promise<ProjectInfo> {
    try {
      const isOrganisationMember = await organisationService.isUserMember(userId, data.organisationId);
      if (!isOrganisationMember) throw new Error('You are not a member of the specified organisation');

      const nameValidation = await this.validateProjectName(data.name, data.organisationId);
      if (!nameValidation.isValid) throw new Error(nameValidation.error || 'Project name is already taken within this organisation');

      const store = await getStoreAsync();
      const project = await store.projects.create(data);
      const org = await store.organisations.findById(data.organisationId);

      return { ...project, organisation: org ? { id: org.id, name: org.name } : undefined };
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async getProjectById(projectId: string): Promise<ProjectInfo | null> {
    try {
      const store = await getStoreAsync();
      const project = await store.projects.findByIdWithFileCount(projectId);
      if (!project) return null;

      const org = await store.organisations.findById(project.organisationId);
      return { ...project, organisation: org ? { id: org.id, name: org.name } : undefined };
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      throw error;
    }
  }

  async getOrganisationProjects(organisationId: string): Promise<ProjectInfo[]> {
    try {
      const store = await getStoreAsync();
      const projects = await store.projects.findByOrgId(organisationId, { isActive: true });
      const org = await store.organisations.findById(organisationId);

      return projects.map(p => ({
        ...p,
        organisation: org ? { id: org.id, name: org.name } : undefined,
      }));
    } catch (error) {
      console.error('Failed to get organisation projects:', error);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<ProjectInfo[]> {
    try {
      const userOrgs = await organisationService.getUserOrganisations(userId);
      if (userOrgs.length === 0) return [];

      const store = await getStoreAsync();
      const allProjects: ProjectInfo[] = [];

      for (const org of userOrgs) {
        const projects = await store.projects.findByOrgId(org.id, { isActive: true });
        allProjects.push(...projects.map(p => ({
          ...p,
          organisation: { id: org.id, name: org.name },
        })));
      }

      allProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return allProjects;
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }

  async updateProject(userId: string, projectId: string, data: UpdateProjectData): Promise<ProjectInfo> {
    try {
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) throw new Error('Project not found');

      const isOrganisationMember = await organisationService.isUserMember(userId, existingProject.organisationId);
      if (!isOrganisationMember) throw new Error('You do not have permission to update this project');

      if (data.name && data.name !== existingProject.name) {
        const nameValidation = await this.validateProjectName(data.name, existingProject.organisationId, projectId);
        if (!nameValidation.isValid) throw new Error(nameValidation.error || 'Project name is already taken');
      }

      const store = await getStoreAsync();
      const updated = await store.projects.update(projectId, data);
      const org = await store.organisations.findById(updated.organisationId);

      return { ...updated, organisation: org ? { id: org.id, name: org.name } : undefined };
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) throw new Error('Project not found');

      const isOrganisationMember = await organisationService.isUserMember(userId, existingProject.organisationId);
      if (!isOrganisationMember) throw new Error('You do not have permission to delete this project');

      const store = await getStoreAsync();
      await store.projects.update(projectId, { isActive: false });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async validateProjectName(name: string, organisationId: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      const formatValidation = validateNameFormat(name);
      if (!formatValidation.isValid) return formatValidation;

      const store = await getStoreAsync();
      const existing = await store.projects.findByNameAndOrg(name, organisationId);

      if (existing && existing.id !== excludeId) {
        return { isValid: false, error: 'A project with this name already exists in this organisation' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Failed to validate project name:', error);
      throw error;
    }
  }

  async canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return false;
      return await organisationService.isUserMember(userId, project.organisationId);
    } catch (error) {
      console.error('Failed to check project access:', error);
      return false;
    }
  }

  async searchProjects(query: string, limit: number = 10) {
    try {
      const store = await getStoreAsync();
      return await store.projects.search(query, limit);
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}

export const projectService = new ProjectService();
