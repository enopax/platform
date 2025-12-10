'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { deployResource } from '@/lib/deployment-service';

export interface CreateResourceState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    type?: string;
    status?: string;
    endpoint?: string;
    quotaLimit?: string;
    projectId?: string;
    tags?: string;
    ownerId?: string;
    organisationName?: string;
  };
}

export interface UpdateResourceState {
  success?: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
    description?: string;
    type?: string;
    status?: string;
    endpoint?: string;
    quotaLimit?: string;
    projectId?: string;
    tags?: string;
    teamId?: string;
  };
}

export async function createResource(
  prevState: CreateResourceState,
  formData: FormData
): Promise<CreateResourceState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string;
    const endpoint = formData.get('endpoint') as string;
    const quotaLimitStr = formData.get('quotaLimit') as string;
    const projectId = formData.get('projectId') as string;
    const tagsStr = formData.get('tags') as string;
    const ownerId = formData.get('ownerId') as string;
    const organisationName = formData.get('organisationName') as string;
    const isPublic = formData.get('isPublic') === 'on';
    const templateId = formData.get('templateId') as string;

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Resource name must be at least 2 characters long',
        fieldErrors: { name: 'Resource name must be at least 2 characters long' }
      };
    }

    if (!type) {
      return {
        error: 'Resource type is required',
        fieldErrors: { type: 'Resource type is required' }
      };
    }

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    if (!organisationName) {
      return {
        error: 'Organisation is required',
        fieldErrors: { organisationName: 'Organisation is required' }
      };
    }

    // Validate owner exists
    const ownerExists = await prisma.user.findUnique({
      where: { id: ownerId }
    });

    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    // Validate organisation exists
    const organisation = await prisma.organisation.findUnique({
      where: { name: organisationName }
    });

    if (!organisation) {
      return {
        error: 'Selected organisation does not exist',
        fieldErrors: { organisationName: 'Selected organisation does not exist' }
      };
    }

    // Check if user is part of the organisation
    const userOrgMembership = await prisma.organisationMember.findFirst({
      where: {
        userId: ownerId,
        organisationId: organisation.id
      }
    });

    if (!userOrgMembership) {
      return {
        error: 'You do not have access to this organisation',
        fieldErrors: { organisationName: 'You do not have access to this organisation' }
      };
    }

    // Validate project if provided
    if (projectId && projectId.trim()) {
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!projectExists) {
        return {
          error: 'Selected project does not exist',
          fieldErrors: { projectId: 'Selected project does not exist' }
        };
      }
    }

    // Validate endpoint URL if provided
    if (endpoint && endpoint.trim()) {
      try {
        new URL(endpoint);
      } catch {
        return {
          error: 'Endpoint must be a valid URL',
          fieldErrors: { endpoint: 'Endpoint must be a valid URL' }
        };
      }
    }

    // Parse quota limit
    let quotaLimit: bigint | null = null;
    if (quotaLimitStr && quotaLimitStr.trim()) {
      const quotaValue = parseInt(quotaLimitStr, 10);
      if (isNaN(quotaValue) || quotaValue < 0) {
        return {
          error: 'Quota limit must be a positive number',
          fieldErrors: { quotaLimit: 'Quota limit must be a positive number' }
        };
      }
      quotaLimit = BigInt(quotaValue);
    }

    // Parse tags
    const tags = tagsStr
      ? tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Check for duplicate resource name for the owner
    const duplicateResource = await prisma.resource.findFirst({
      where: {
        name: name.trim(),
        ownerId,
        isActive: true,
      }
    });

    if (duplicateResource) {
      return {
        error: 'You already have a resource with this name',
        fieldErrors: { name: 'You already have a resource with this name' }
      };
    }

    // Use organisation ID from the validated organisation
    const organisationId = organisation.id;

    // Create the resource with PROVISIONING status if template is provided
    const initialStatus = templateId ? 'PROVISIONING' : (status || 'ACTIVE');

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type as any,
        status: initialStatus as any,
        endpoint: endpoint?.trim() || null,
        quotaLimit,
        ownerId,
        organisationId,
        isPublic,
        tags,
        configuration: templateId ? {
          templateId,
          deploymentStage: 'init',
          deploymentProgress: 0,
          deploymentMessage: 'Preparing deployment...'
        } : null,
      },
    });

    // If a project was provided, link the resource to the project
    if (projectId && projectId.trim()) {
      try {
        await prisma.projectResource.create({
          data: {
            projectId: projectId.trim(),
            resourceId: resource.id,
            allocatedBy: ownerId,
          },
        });
        console.log(`✅ Resource ${resource.id} linked to project ${projectId}`);
      } catch (linkError) {
        console.error('Failed to link resource to project:', linkError);
        // Still consider it a success since the resource was created
      }
    }

    // Trigger deployment if template is provided
    if (templateId) {
      try {
        await deployResource(resource.id, templateId);
        console.log(`🚀 Started deployment for resource ${resource.id} using template ${templateId}`);
      } catch (deployError) {
        console.error('Failed to start deployment:', deployError);
        // Resource is still created, deployment will be marked as failed
      }
    }

    revalidatePath('/main/resources');
    if (projectId) {
      revalidatePath(`/orga/${organisationId}/projects/${projectId.trim()}`);
      console.log(`🔄 Revalidated project path for org ${organisationId}, project ${projectId.trim()}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to create resource:', error);
    return {
      error: 'Failed to create resource. Please try again.',
    };
  }
}

export async function updateResource(
  resourceId: string,
  prevState: UpdateResourceState,
  formData: FormData
): Promise<UpdateResourceState> {
  try {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const type = formData.get('type') as string;
    const status = formData.get('status') as string;
    const endpoint = formData.get('endpoint') as string;
    const quotaLimitStr = formData.get('quotaLimit') as string;
    const projectId = formData.get('projectId') as string;
    const tagsStr = formData.get('tags') as string;
    const isPublic = formData.get('isPublic') === 'on';

    // Basic validation
    if (!name || name.trim().length < 2) {
      return {
        error: 'Resource name must be at least 2 characters long',
        fieldErrors: { name: 'Resource name must be at least 2 characters long' }
      };
    }

    if (!type) {
      return {
        error: 'Resource type is required',
        fieldErrors: { type: 'Resource type is required' }
      };
    }

    // Validate project if provided
    if (projectId && projectId.trim()) {
      const projectExists = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!projectExists) {
        return {
          error: 'Selected project does not exist',
          fieldErrors: { projectId: 'Selected project does not exist' }
        };
      }
    }

    // Validate endpoint URL if provided
    if (endpoint && endpoint.trim()) {
      try {
        new URL(endpoint);
      } catch {
        return {
          error: 'Endpoint must be a valid URL',
          fieldErrors: { endpoint: 'Endpoint must be a valid URL' }
        };
      }
    }

    // Parse quota limit
    let quotaLimit: bigint | null = null;
    if (quotaLimitStr && quotaLimitStr.trim()) {
      const quotaValue = parseInt(quotaLimitStr, 10);
      if (isNaN(quotaValue) || quotaValue < 0) {
        return {
          error: 'Quota limit must be a positive number',
          fieldErrors: { quotaLimit: 'Quota limit must be a positive number' }
        };
      }
      quotaLimit = BigInt(quotaValue);
    }

    // Parse tags
    const tags = tagsStr
      ? tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    // Get the current resource to check ownership
    const currentResource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });

    if (!currentResource) {
      return {
        error: 'Resource not found',
      };
    }

    // Check for duplicate resource name for the owner (excluding current resource)
    const duplicateResource = await prisma.resource.findFirst({
      where: {
        name: name.trim(),
        ownerId: currentResource.ownerId,
        isActive: true,
        NOT: { id: resourceId }
      }
    });

    if (duplicateResource) {
      return {
        error: 'You already have a resource with this name',
        fieldErrors: { name: 'You already have a resource with this name' }
      };
    }

    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type as any,
        status: status as any,
        endpoint: endpoint?.trim() || null,
        quotaLimit,
        projectId: projectId?.trim() || null,
        isPublic,
        tags,
      },
    });

    revalidatePath('/main/resources');
    revalidatePath(`/main/resources/${resourceId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update resource:', error);
    return {
      error: 'Failed to update resource. Please try again.',
    };
  }
}

export async function deleteResource(resourceId: string) {
  try {
    await prisma.resource.update({
      where: { id: resourceId },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    revalidatePath('/main/resources');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete resource:', error);
    return {
      error: 'Failed to delete resource. Please try again.',
    };
  }
}

// Allocate resource to project
export async function allocateResourceToProject(
  resourceId: string,
  projectId: string,
  allocatedBy: string,
  quotaLimit?: bigint
) {
  try {
    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId, isActive: true },
      include: { organisation: true }
    });

    if (!resource) {
      return { error: 'Resource not found' };
    }

    // Check if project exists and belongs to same organisation
    const project = await prisma.project.findUnique({
      where: { id: projectId, isActive: true }
    });

    if (!project) {
      return { error: 'Project not found' };
    }

    if (project.organisationId !== resource.organisationId) {
      return { error: 'Resource and project must belong to the same organisation' };
    }

    // Check if allocation already exists
    const existingAllocation = await prisma.projectResource.findUnique({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId
        }
      }
    });

    if (existingAllocation) {
      return { error: 'Resource is already allocated to this project' };
    }

    // Create allocation
    await prisma.projectResource.create({
      data: {
        projectId,
        resourceId,
        allocatedBy,
        quotaLimit
      }
    });

    revalidatePath(`/orga/${resource.organisation.name}/resources/${resourceId}`);
    revalidatePath(`/orga/${resource.organisation.name}/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to allocate resource to project:', error);
    return { error: 'Failed to allocate resource. Please try again.' };
  }
}

// Remove resource allocation from project
export async function removeResourceFromProject(
  resourceId: string,
  projectId: string
) {
  try {
    const allocation = await prisma.projectResource.findUnique({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId
        }
      },
      include: {
        resource: {
          include: { organisation: true }
        }
      }
    });

    if (!allocation) {
      return { error: 'Allocation not found' };
    }

    await prisma.projectResource.delete({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId
        }
      }
    });

    revalidatePath(`/orga/${allocation.resource.organisation.name}/resources/${resourceId}`);
    revalidatePath(`/orga/${allocation.resource.organisation.name}/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to remove resource allocation:', error);
    return { error: 'Failed to remove allocation. Please try again.' };
  }
}

// Update resource allocation quota
export async function updateResourceAllocationQuota(
  resourceId: string,
  projectId: string,
  quotaLimit: bigint | null
) {
  try {
    const allocation = await prisma.projectResource.findUnique({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId
        }
      },
      include: {
        resource: {
          include: { organisation: true }
        }
      }
    });

    if (!allocation) {
      return { error: 'Allocation not found' };
    }

    await prisma.projectResource.update({
      where: {
        projectId_resourceId: {
          projectId,
          resourceId
        }
      },
      data: {
        quotaLimit
      }
    });

    revalidatePath(`/orga/${allocation.resource.organisation.name}/resources/${resourceId}`);
    revalidatePath(`/orga/${allocation.resource.organisation.name}/projects/${projectId}`);

    return { success: true };
  } catch (error) {
    console.error('Failed to update allocation quota:', error);
    return { error: 'Failed to update quota. Please try again.' };
  }
}

// Get available resources for a project
export async function getAvailableResourcesForProject(organisationId: string, projectId: string) {
  try {
    // Get resources that are:
    // 1. In the same organisation
    // 2. Not already allocated to this project
    // 3. Active
    const resources = await prisma.resource.findMany({
      where: {
        organisationId,
        isActive: true,
        allocatedProjects: {
          none: {
            projectId
          }
        }
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        endpoint: true,
        quotaLimit: true,
        currentUsage: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return resources;
  } catch (error) {
    console.error('Failed to fetch available resources:', error);
    return [];
  }
}

// Search function for resources
export async function findResources(query: string, organisationId: string) {
  try {
    const resources = await prisma.resource.findMany({
      where: {
        organisationId,
        isActive: true,
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
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        endpoint: true
      },
      orderBy: {
        name: 'asc'
      },
      take: 10,
    });

    return resources;
  } catch (error) {
    console.error('Failed to search resources:', error);
    return [];
  }
}