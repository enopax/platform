'use server';

import { revalidatePath } from 'next/cache';
import { type ProjectStatus, type ProjectPriority } from '@prisma/client';
import { projectService } from '@/lib/services/project';
import { userService } from '@/lib/services/user';
import { prisma } from '@/lib/prisma';

export interface UpdateProjectState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    development?: string;
    status?: string;
    priority?: string;
    budget?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    actualEndDate?: string;
    progress?: string;
    repositoryUrl?: string;
    documentationUrl?: string;
    teamId?: string;
  };
}

export interface CreateProjectState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    development?: string;
    status?: string;
    priority?: string;
    budget?: string;
    currency?: string;
    startDate?: string;
    endDate?: string;
    actualEndDate?: string;
    progress?: string;
    repositoryUrl?: string;
    documentationUrl?: string;
    teamId?: string;
  };
}

function validateUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

export async function updateProject(
  prevState: UpdateProjectState,
  formData: FormData
): Promise<UpdateProjectState> {
  try {
    const projectId = formData.get('projectId') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const development = formData.get('development') === 'on';
    const status = formData.get('status') as ProjectStatus;
    const priority = formData.get('priority') as ProjectPriority;
    const budgetStr = formData.get('budget') as string;
    const currency = formData.get('currency') as string;
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const actualEndDateStr = formData.get('actualEndDate') as string;
    const progressStr = formData.get('progress') as string;
    const repositoryUrl = formData.get('repositoryUrl') as string;
    const documentationUrl = formData.get('documentationUrl') as string;
    const teamId = formData.get('teamId') as string;
    const userId = formData.get('userId') as string; // Should be passed from client

    // Basic validation
    if (!projectId) {
      return {
        error: 'Project ID is required',
        fieldErrors: { name: 'Project ID is required' }
      };
    }

    if (!name || name.trim().length < 2) {
      return {
        error: 'Project name must be at least 2 characters long',
        fieldErrors: { name: 'Project name must be at least 2 characters long' }
      };
    }

    if (!userId) {
      return {
        error: 'User ID is required',
        fieldErrors: { name: 'User ID is required' }
      };
    }

    // Validate dates
    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;
    const actualEndDate = actualEndDateStr ? new Date(actualEndDateStr) : undefined;

    if (startDate && endDate && startDate >= endDate) {
      return {
        error: 'End date must be after start date',
        fieldErrors: { endDate: 'End date must be after start date' }
      };
    }

    // Validate progress
    const progress = progressStr ? parseInt(progressStr) : undefined;
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return {
        error: 'Progress must be between 0 and 100',
        fieldErrors: { progress: 'Progress must be between 0 and 100' }
      };
    }

    // Validate budget
    const budget = budgetStr ? parseFloat(budgetStr) : undefined;
    if (budgetStr && (isNaN(budget!) || budget! < 0)) {
      return {
        error: 'Budget must be a valid positive number',
        fieldErrors: { budget: 'Budget must be a valid positive number' }
      };
    }

    // Validate URLs
    if (repositoryUrl && repositoryUrl.trim() && !validateUrl(repositoryUrl)) {
      return {
        error: 'Invalid repository URL format',
        fieldErrors: { repositoryUrl: 'Invalid repository URL format' }
      };
    }

    if (documentationUrl && documentationUrl.trim() && !validateUrl(documentationUrl)) {
      return {
        error: 'Invalid documentation URL format',
        fieldErrors: { documentationUrl: 'Invalid documentation URL format' }
      };
    }

    // Get current project to check organisation
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { organisationId: true }
    });

    if (!currentProject) {
      return {
        error: 'Project not found',
        fieldErrors: { name: 'Project not found' }
      };
    }

    // Validate team if provided
    if (teamId && teamId.trim() && teamId !== '__NONE__') {
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, organisationId: true }
      });

      if (!teamExists) {
        return {
          error: 'Selected team does not exist',
          fieldErrors: { teamId: 'Selected team does not exist' }
        };
      }

      if (teamExists.organisationId !== currentProject.organisationId) {
        return {
          error: 'Team must belong to the same organisation as the project',
          fieldErrors: { teamId: 'Team must belong to the same organisation as the project' }
        };
      }
    }

    // Update project
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        development,
        status,
        priority,
        budget,
        currency: currency || 'USD',
        startDate,
        endDate,
        actualEndDate,
        progress,
        repositoryUrl: repositoryUrl?.trim() || null,
        documentationUrl: documentationUrl?.trim() || null,
      }
    });

    // Handle team assignment
    if (teamId && teamId.trim() && teamId !== '__NONE__') {
      // Remove existing team assignments
      await prisma.projectTeam.deleteMany({
        where: { projectId }
      });

      // Add new team assignment
      await prisma.projectTeam.create({
        data: {
          projectId,
          teamId: teamId.trim(),
          assignedBy: userId,
        }
      });
    } else if (teamId === '__NONE__') {
      // Remove all team assignments if explicitly unassigning
      await prisma.projectTeam.deleteMany({
        where: { projectId }
      });
    }

    // Get organisation name for revalidation
    const org = await prisma.organisation.findUnique({
      where: { id: currentProject.organisationId },
      select: { name: true }
    });

    revalidatePath('/admin/project');
    revalidatePath(`/admin/project/${projectId}`);
    revalidatePath('/main');
    revalidatePath('/main/projects');
    revalidatePath(`/main/projects/${projectId}`);
    if (org) {
      revalidatePath(`/main/organisations/${org.name}/projects/${projectId}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update project:', error);
    return {
      error: error instanceof Error ? error.message : 'Failed to update project. Please try again.',
    };
  }
}

export async function createProject(
  prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const development = formData.get('development') === 'on';
    const status = (formData.get('status') as ProjectStatus) || 'PLANNING';
    const priority = (formData.get('priority') as ProjectPriority) || 'MEDIUM';
    const budgetStr = formData.get('budget') as string;
    const currency = formData.get('currency') as string;
    const startDateStr = formData.get('startDate') as string;
    const endDateStr = formData.get('endDate') as string;
    const actualEndDateStr = formData.get('actualEndDate') as string;
    const progressStr = formData.get('progress') as string;
    const repositoryUrl = formData.get('repositoryUrl') as string;
    const documentationUrl = formData.get('documentationUrl') as string;
    const teamId = formData.get('teamId') as string;
    const currentUserId = formData.get('currentUserId') as string;

    // Basic validation
    if (!currentUserId) {
      return {
        error: 'User authentication required',
        fieldErrors: { name: 'User authentication required' }
      };
    }
    if (!name || name.trim().length < 2) {
      return {
        error: 'Project name must be at least 2 characters long',
        fieldErrors: { name: 'Project name must be at least 2 characters long' }
      };
    }


    // Team is now optional

    // Validate dates
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;
    const actualEndDate = actualEndDateStr ? new Date(actualEndDateStr) : null;

    if (startDate && endDate && startDate >= endDate) {
      return {
        error: 'End date must be after start date',
        fieldErrors: { endDate: 'End date must be after start date' }
      };
    }

    // Validate progress
    const progress = progressStr ? parseInt(progressStr) : 0;
    if (progress < 0 || progress > 100) {
      return {
        error: 'Progress must be between 0 and 100',
        fieldErrors: { progress: 'Progress must be between 0 and 100' }
      };
    }

    // Validate budget
    const budget = budgetStr ? parseFloat(budgetStr) : null;
    if (budgetStr && (isNaN(budget!) || budget! < 0)) {
      return {
        error: 'Budget must be a valid positive number',
        fieldErrors: { budget: 'Budget must be a valid positive number' }
      };
    }

    // Validate URLs
    if (repositoryUrl && repositoryUrl.trim() && !validateUrl(repositoryUrl)) {
      return {
        error: 'Invalid repository URL format',
        fieldErrors: { repositoryUrl: 'Invalid repository URL format' }
      };
    }

    if (documentationUrl && documentationUrl.trim() && !validateUrl(documentationUrl)) {
      return {
        error: 'Invalid documentation URL format',
        fieldErrors: { documentationUrl: 'Invalid documentation URL format' }
      };
    }


    // Validate team exists (only if team is provided and not "skip")
    let organisationId = null;
    if (teamId && teamId.trim() && teamId !== '__NONE__') {
      const teamExists = await prisma.team.findUnique({
        where: { id: teamId },
        select: { id: true, organisationId: true }
      });

      if (!teamExists) {
        return {
          error: 'Selected team does not exist',
          fieldErrors: { teamId: 'Selected team does not exist' }
        };
      }
      organisationId = teamExists.organisationId;
    }

    // For now, we need to get organisationId from somewhere if no team is provided
    // This should be passed from the form
    if (!organisationId) {
      const orgId = formData.get('organisationId') as string;
      if (!orgId) {
        return {
          error: 'Organisation context is required',
          fieldErrors: { name: 'Organisation context is required' }
        };
      }
      organisationId = orgId;
    }

    // Check for duplicate project name within the organisation
    const duplicateProject = await prisma.project.findFirst({
      where: {
        name: name.trim(),
        organisationId
      }
    });

    if (duplicateProject) {
      return {
        error: 'A project with this name already exists in this organisation',
        fieldErrors: { name: 'A project with this name already exists in this organisation' }
      };
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        development,
        status,
        priority,
        budget,
        currency: currency || 'USD',
        startDate,
        endDate,
        actualEndDate,
        progress,
        repositoryUrl: repositoryUrl?.trim() || null,
        documentationUrl: documentationUrl?.trim() || null,
        organisationId,
      },
    });

    // If a team was provided (and not "skip"), create the project-team relationship
    if (teamId && teamId.trim() && teamId !== '__NONE__') {
      await prisma.projectTeam.create({
        data: {
          projectId: project.id,
          teamId: teamId.trim(),
          assignedBy: currentUserId,
        },
      });
    }

    // Get organisation name for revalidation
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true }
    });

    revalidatePath('/admin/project');
    revalidatePath('/main');
    revalidatePath('/main/projects');
    if (org) {
      revalidatePath(`/main/organisations/${org.name}`);
      revalidatePath(`/main/organisations/${org.name}/projects`);
      revalidatePath(`/main/organisations/${org.name}/projects/new`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to create project:', error);
    return {
      error: 'Failed to create project. Please try again.',
    };
  }
}

// Real database project search function
export async function findProjects(query: string) {
  try {
    // Use service to search projects (this would need to be implemented in the service)
    const projects = await projectService.searchProjects(query);
    return projects;
  } catch (error) {
    console.error('Failed to search projects:', error);
    return [];
  }
}