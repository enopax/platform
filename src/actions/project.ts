'use server';

import { revalidatePath } from 'next/cache';
import { type ProjectStatus, type ProjectPriority } from '@prisma/client';
import { projectService } from '@/lib/services/project';
import { userService } from '@/lib/services/user';
import { prisma } from '@/lib/prisma';
import { validateNameFormat } from '@/lib/name-validation';

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
    const userId = formData.get('userId') as string; // Should be passed from client

    // Basic validation
    if (!projectId) {
      return {
        error: 'Project ID is required',
        fieldErrors: { name: 'Project ID is required' }
      };
    }

    // Validate project name format
    const nameValidation = validateNameFormat(name);
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid project name',
        fieldErrors: { name: nameValidation.error || 'Invalid project name' }
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

    // Validate project name is not already in use (excluding current project)
    const nameAvailability = await projectService.validateProjectName(name.trim(), currentProject.organisationId, projectId);
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Project name is not available',
        fieldErrors: { name: nameAvailability.error || 'Project name is not available' }
      };
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

    // Get organisation name for revalidation
    const org = await prisma.organisation.findUnique({
      where: { id: currentProject.organisationId },
      select: { name: true }
    });

    revalidatePath('/admin/project');
    revalidatePath(`/admin/project/${projectId}`);
    if (org) {
      revalidatePath(`/orga/${org.name}`);
      revalidatePath(`/orga/${org.name}/${projectId}`);
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
    const currentUserId = formData.get('currentUserId') as string;

    // Basic validation
    if (!currentUserId) {
      return {
        error: 'User authentication required',
        fieldErrors: { name: 'User authentication required' }
      };
    }

    // Validate project name format
    const nameValidation = validateNameFormat(name);
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid project name',
        fieldErrors: { name: nameValidation.error || 'Invalid project name' }
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

    // Get organisation ID from form
    const organisationId = formData.get('organisationId') as string;
    if (!organisationId) {
      return {
        error: 'Organisation context is required',
        fieldErrors: { name: 'Organisation context is required' }
      };
    }

    // Validate project name is not already in use within the organisation
    const nameAvailability = await projectService.validateProjectName(name.trim(), organisationId);
    if (!nameAvailability.isValid) {
      return {
        error: nameAvailability.error || 'Project name is not available',
        fieldErrors: { name: nameAvailability.error || 'Project name is not available' }
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

    // Get organisation name for revalidation
    const org = await prisma.organisation.findUnique({
      where: { id: organisationId },
      select: { name: true }
    });

    revalidatePath('/admin/project');
    if (org) {
      revalidatePath(`/orga/${org.name}`);
      revalidatePath(`/orga/${org.name}/new-project`);
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