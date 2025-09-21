'use server';

import { revalidatePath } from 'next/cache';
import { type ProjectStatus, type ProjectPriority } from '@prisma/client';
import { projectService } from '@/lib/services/project';
import { userService } from '@/lib/services/user';

export interface UpdateProjectState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
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
    organisationId?: string;
    teamId?: string;
  };
}

export interface CreateProjectState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
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
    organisationId?: string;
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

    // Use service to update project
    await projectService.updateProject(userId, projectId, {
      name: name.trim(),
      description: description?.trim() || undefined,
      status,
      priority,
      budget,
      currency: currency || 'USD',
      startDate,
      endDate,
      actualEndDate,
      progress,
      repositoryUrl: repositoryUrl?.trim() || undefined,
      documentationUrl: documentationUrl?.trim() || undefined,
      teamId,
    });

    revalidatePath('/admin/project');
    revalidatePath(`/admin/project/${projectId}`);
    revalidatePath('/main');
    revalidatePath('/main/projects');
    revalidatePath(`/main/projects/${projectId}`);

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
    const organisationId = formData.get('organisationId') as string;
    const teamId = formData.get('teamId') as string;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Project name must be at least 2 characters long',
        fieldErrors: { name: 'Project name must be at least 2 characters long' }
      };
    }

    if (!organisationId) {
      return {
        error: 'Organisation is required',
        fieldErrors: { organisationId: 'Organisation is required' }
      };
    }

    if (!teamId) {
      return {
        error: 'Team is required',
        fieldErrors: { teamId: 'Team is required' }
      };
    }

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

    // Validate organisation exists
    const organisationExists = await prisma.organisation.findUnique({
      where: { id: organisationId }
    });

    if (!organisationExists) {
      return {
        error: 'Selected organisation does not exist',
        fieldErrors: { organisationId: 'Selected organisation does not exist' }
      };
    }

    // Validate team exists
    const teamExists = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!teamExists) {
      return {
        error: 'Selected team does not exist',
        fieldErrors: { teamId: 'Selected team does not exist' }
      };
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
        error: 'A project with this name already exists in the organisation',
        fieldErrors: { name: 'A project with this name already exists in the organisation' }
      };
    }

    await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
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
        teamId,
      },
    });

    revalidatePath('/admin/project');
    revalidatePath('/main');
    revalidatePath('/main/projects');

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