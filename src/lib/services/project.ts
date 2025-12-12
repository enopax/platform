import { PrismaClient, ProjectStatus, ProjectPriority } from '@prisma/client';
import { organisationService } from './organisation';
import { validateNameFormat } from '../name-validation';

const prisma = new PrismaClient();

export interface CreateProjectData {
  name: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  progress?: number;
  repositoryUrl?: string;
  documentationUrl?: string;
  organisationId: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
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
  organisationId?: string;
}

export interface ProjectInfo {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  budget?: number;
  currency?: string;
  startDate?: Date;
  endDate?: Date;
  actualEndDate?: Date;
  progress: number;
  repositoryUrl?: string;
  documentationUrl?: string;
  organisationId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  organisation: {
    id: string;
    name: string;
  };
  fileCount?: number;
}

export class ProjectService {

  async createProject(userId: string, data: CreateProjectData): Promise<ProjectInfo> {
    try {
      // Verify user is a member of the organisation
      const isOrganisationMember = await organisationService.isUserMember(userId, data.organisationId);
      if (!isOrganisationMember) {
        throw new Error('You are not a member of the specified organisation');
      }

      // Check if project name is already taken within the organisation
      const isNameAvailable = await this.validateProjectName(data.name, data.organisationId);
      if (!isNameAvailable) {
        throw new Error('Project name is already taken within this organisation');
      }

      const project = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          status: data.status || ProjectStatus.PLANNING,
          priority: data.priority || ProjectPriority.MEDIUM,
          budget: data.budget,
          currency: data.currency || 'GBP',
          startDate: data.startDate,
          endDate: data.endDate,
          progress: data.progress || 0,
          repositoryUrl: data.repositoryUrl,
          documentationUrl: data.documentationUrl,
          organisationId: data.organisationId,
        },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget ? Number(project.budget) : undefined,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
      };
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  }

  async getProjectById(projectId: string): Promise<ProjectInfo | null> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              files: true,
            }
          }
        }
      });

      if (!project) return null;

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget ? Number(project.budget) : undefined,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        fileCount: project._count.files,
      };
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      throw error;
    }
  }

  async getOrganisationProjects(organisationId: string): Promise<ProjectInfo[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          organisationId: organisationId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              files: true,
            }
          }
        }
      });

      return projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget ? Number(project.budget) : undefined,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        fileCount: project._count.files,
      }));
    } catch (error) {
      console.error('Failed to get organisation projects:', error);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<ProjectInfo[]> {
    try {
      // Get all organisations the user is a member of
      const userOrganisations = await organisationService.getUserOrganisations(userId);
      const organisationIds = userOrganisations.map(org => org.id);

      if (organisationIds.length === 0) {
        return [];
      }

      const projects = await prisma.project.findMany({
        where: {
          organisationId: { in: organisationIds },
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              files: true,
            }
          }
        }
      });

      return projects.map(project => ({
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget ? Number(project.budget) : undefined,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        fileCount: project._count.files,
      }));
    } catch (error) {
      console.error('Failed to get user projects:', error);
      throw error;
    }
  }

  async updateProject(userId: string, projectId: string, data: UpdateProjectData): Promise<ProjectInfo> {
    try {
      // Get the existing project
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) {
        throw new Error('Project not found');
      }

      // Verify user is a member of the project's organisation
      const isOrganisationMember = await organisationService.isUserMember(userId, existingProject.organisationId);
      if (!isOrganisationMember) {
        throw new Error('You do not have permission to update this project');
      }

      // If organisationId is being changed, verify user is member of new organisation
      if (data.organisationId && data.organisationId !== existingProject.organisationId) {
        const isNewOrganisationMember = await organisationService.isUserMember(userId, data.organisationId);
        if (!isNewOrganisationMember) {
          throw new Error('You are not a member of the specified organisation');
        }
      }

      // If project name is being changed, validate uniqueness within organisation
      if (data.name && data.name !== existingProject.name) {
        const targetOrganisationId = data.organisationId || existingProject.organisationId;
        const nameValidation = await this.validateProjectName(data.name, targetOrganisationId, projectId);
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.error || 'Project name is already taken within this organisation');
        }
      }

      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.budget !== undefined) updateData.budget = data.budget;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.startDate !== undefined) updateData.startDate = data.startDate;
      if (data.endDate !== undefined) updateData.endDate = data.endDate;
      if (data.actualEndDate !== undefined) updateData.actualEndDate = data.actualEndDate;
      if (data.progress !== undefined) updateData.progress = data.progress;
      if (data.repositoryUrl !== undefined) updateData.repositoryUrl = data.repositoryUrl;
      if (data.documentationUrl !== undefined) updateData.documentationUrl = data.documentationUrl;
      if (data.organisationId !== undefined) updateData.organisationId = data.organisationId;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          organisation: {
            select: {
              id: true,
              name: true,
            }
          },
          _count: {
            select: {
              files: true,
            }
          }
        }
      });

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority,
        budget: project.budget ? Number(project.budget) : undefined,
        currency: project.currency,
        startDate: project.startDate,
        endDate: project.endDate,
        actualEndDate: project.actualEndDate,
        progress: project.progress,
        repositoryUrl: project.repositoryUrl,
        documentationUrl: project.documentationUrl,
        organisationId: project.organisationId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        organisation: project.organisation,
        fileCount: project._count.files,
      };
    } catch (error) {
      console.error('Failed to update project:', error);
      throw error;
    }
  }

  async deleteProject(userId: string, projectId: string): Promise<void> {
    try {
      // Get the existing project
      const existingProject = await this.getProjectById(projectId);
      if (!existingProject) {
        throw new Error('Project not found');
      }

      // Verify user is a member of the project's organisation
      const isOrganisationMember = await organisationService.isUserMember(userId, existingProject.organisationId);
      if (!isOrganisationMember) {
        throw new Error('You do not have permission to delete this project');
      }

      // Soft delete (set isActive to false)
      await prisma.project.update({
        where: { id: projectId },
        data: { isActive: false }
      });
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  }

  async validateProjectName(name: string, organisationId: string, excludeId?: string): Promise<{ isValid: boolean; error?: string }> {
    try {
      // First validate format and blocked names
      const formatValidation = validateNameFormat(name);
      if (!formatValidation.isValid) {
        return formatValidation;
      }

      const whereClause: any = {
        name,
        organisationId,
        isActive: true,
      };

      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const existingProject = await prisma.project.findFirst({
        where: whereClause
      });

      if (existingProject) {
        return {
          isValid: false,
          error: 'A project with this name already exists in this organisation',
        };
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
      const projects = await prisma.project.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              description: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          progress: true,
          startDate: true,
          endDate: true,
          budget: true,
          currency: true,
          repositoryUrl: true,
          documentationUrl: true,
          isActive: true,
          organisationId: true,
          organisation: {
            select: {
              id: true,
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { updatedAt: 'desc' },
        ],
        take: limit,
      });

      return projects;
    } catch (error) {
      console.error('Failed to search projects:', error);
      return [];
    }
  }
}

export const projectService = new ProjectService();