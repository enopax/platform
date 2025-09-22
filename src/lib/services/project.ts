import { PrismaClient, ProjectStatus, ProjectPriority } from '@prisma/client';
import { teamService } from './team';

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
  teamId: string;
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
  teamId?: string;
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
  teamId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  team: {
    id: string;
    name: string;
    organisation?: {
      id: string;
      name: string;
    } | null;
  };
  fileCount?: number;
}

export class ProjectService {

  async createProject(userId: string, data: CreateProjectData): Promise<ProjectInfo> {
    try {
      // Verify user is a member of the team
      const isTeamMember = await teamService.isUserMember(userId, data.teamId);
      if (!isTeamMember) {
        throw new Error('You are not a member of the specified team');
      }

      // Get team details to check organisation
      const team = await teamService.getTeamById(data.teamId);
      if (!team) {
        throw new Error('Team not found');
      }

      // Check if project name is already taken within the team
      const isNameAvailable = await this.validateProjectName(data.name, data.teamId);
      if (!isNameAvailable) {
        throw new Error('Project name is already taken within this team');
      }

      const project = await prisma.project.create({
        data: {
          name: data.name,
          description: data.description,
          status: data.status || ProjectStatus.PLANNING,
          priority: data.priority || ProjectPriority.MEDIUM,
          budget: data.budget,
          currency: data.currency || 'USD',
          startDate: data.startDate,
          endDate: data.endDate,
          progress: data.progress || 0,
          repositoryUrl: data.repositoryUrl,
          documentationUrl: data.documentationUrl,
          teamId: data.teamId,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
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
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
        fileCount: project._count.files,
      };
    } catch (error) {
      console.error('Failed to get project by ID:', error);
      throw error;
    }
  }

  async getTeamProjects(teamId: string): Promise<ProjectInfo[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          teamId,
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
        fileCount: project._count.files,
      }));
    } catch (error) {
      console.error('Failed to get team projects:', error);
      throw error;
    }
  }

  async getOrganisationProjects(organisationId: string): Promise<ProjectInfo[]> {
    try {
      const projects = await prisma.project.findMany({
        where: {
          team: {
            organisationId: organisationId
          },
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
        fileCount: project._count.files,
      }));
    } catch (error) {
      console.error('Failed to get organisation projects:', error);
      throw error;
    }
  }

  async getUserProjects(userId: string): Promise<ProjectInfo[]> {
    try {
      // Get all teams the user is a member of
      const userTeams = await teamService.getUserTeams(userId);
      const teamIds = userTeams.map(team => team.id);

      if (teamIds.length === 0) {
        return [];
      }

      const projects = await prisma.project.findMany({
        where: {
          teamId: { in: teamIds },
          isActive: true
        },
        orderBy: { createdAt: 'desc' },
        include: {
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
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

      // Verify user is a member of the project's current team
      const isTeamMember = await teamService.isUserMember(userId, existingProject.teamId);
      if (!isTeamMember) {
        throw new Error('You do not have permission to update this project');
      }

      // If teamId is being changed, verify user is member of new team
      if (data.teamId && data.teamId !== existingProject.teamId) {
        const isNewTeamMember = await teamService.isUserMember(userId, data.teamId);
        if (!isNewTeamMember) {
          throw new Error('You are not a member of the specified team');
        }
      }

      // If project name is being changed, validate uniqueness within team
      if (data.name && data.name !== existingProject.name) {
        const targetTeamId = data.teamId || existingProject.teamId;
        const isNameAvailable = await this.validateProjectName(data.name, targetTeamId, projectId);
        if (!isNameAvailable) {
          throw new Error('Project name is already taken within this team');
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
      if (data.teamId !== undefined) updateData.teamId = data.teamId;

      const project = await prisma.project.update({
        where: { id: projectId },
        data: updateData,
        include: {
          team: {
            select: {
              id: true,
              name: true,
              organisation: {
                select: {
                  id: true,
                  name: true,
                }
              }
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
        teamId: project.teamId,
        isActive: project.isActive,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        team: project.team,
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

      // Verify user is a member of the project's team with sufficient permissions
      const userRole = await teamService.getUserRole(userId, existingProject.teamId);
      if (!userRole || userRole === 'MEMBER') {
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

  async validateProjectName(name: string, teamId: string, excludeId?: string): Promise<boolean> {
    try {
      const whereClause: any = {
        name,
        teamId,
        isActive: true,
      };

      if (excludeId) {
        whereClause.id = { not: excludeId };
      }

      const existingProject = await prisma.project.findFirst({
        where: whereClause
      });

      return !existingProject;
    } catch (error) {
      console.error('Failed to validate project name:', error);
      throw error;
    }
  }

  async canUserAccessProject(userId: string, projectId: string): Promise<boolean> {
    try {
      const project = await this.getProjectById(projectId);
      if (!project) return false;

      return await teamService.isUserMember(userId, project.teamId);
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
          team: {
            select: {
              name: true,
              organisation: {
                select: {
                  name: true,
                },
              },
              owner: {
                select: {
                  name: true,
                  firstname: true,
                  lastname: true,
                  email: true,
                },
              },
              _count: {
                select: {
                  members: true,
                },
              },
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