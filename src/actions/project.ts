'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { type ProjectStatus, type ProjectPriority } from '@prisma/client';

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
    const organisationId = formData.get('organisationId') as string;
    const teamId = formData.get('teamId') as string;

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

    // Check for duplicate project name within the organisation (excluding current project)
    const duplicateProject = await prisma.project.findFirst({
      where: {
        name: name.trim(),
        organisationId,
        NOT: { id: projectId }
      }
    });

    if (duplicateProject) {
      return {
        error: 'A project with this name already exists in the organisation',
        fieldErrors: { name: 'A project with this name already exists in the organisation' }
      };
    }

    await prisma.project.update({
      where: { id: projectId },
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
    revalidatePath(`/admin/project/${projectId}`);
    revalidatePath('/main');
    revalidatePath('/main/projects');
    revalidatePath(`/main/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update project:', error);
    return {
      error: 'Failed to update project. Please try again.',
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
    // Search projects by name or description
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
        isActive: true, // Only show active projects
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
        organisation: {
          select: {
            name: true,
          },
        },
        team: {
          select: {
            name: true,
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
      take: 10, // Limit to 10 results
    });

    return projects;
  } catch (error) {
    console.error('Failed to search projects:', error);
    return [];
  }
}