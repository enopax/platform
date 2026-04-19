'use server';

import { getStoreAsync } from '@/lib/store';
import { revalidatePath } from 'next/cache';
import { deployResource } from '@/lib/deployment-service';
import { validateNameFormat } from '@/lib/name-validation';

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

    // Validate resource name format
    const nameValidation = validateNameFormat(name, 'resource');
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid resource name',
        fieldErrors: { name: nameValidation.error || 'Invalid resource name' }
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
    const store = await getStoreAsync();
    const ownerExists = await store.users.findById(ownerId);

    if (!ownerExists) {
      return {
        error: 'Selected owner does not exist',
        fieldErrors: { ownerId: 'Selected owner does not exist' }
      };
    }

    const organisation = await store.organisations.findByName(organisationName);

    if (!organisation) {
      return {
        error: 'Selected organisation does not exist',
        fieldErrors: { organisationName: 'Selected organisation does not exist' }
      };
    }

    const userOrgMembership = await store.organisationMembers.findByUserAndOrg(ownerId, organisation.id);

    if (!userOrgMembership) {
      return {
        error: 'You do not have access to this organisation',
        fieldErrors: { organisationName: 'You do not have access to this organisation' }
      };
    }

    // Validate project if provided
    if (projectId && projectId.trim()) {
      const projectExists = await store.projects.findById(projectId);

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
    const ownerResources = await store.resources.findByOwnerId(ownerId);
    const duplicateResource = ownerResources.find(
      r => r.name === name.trim() && r.isActive
    );

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

    const resource = await store.resources.create({
      name: name.trim(),
      description: description?.trim() || null,
      type: type as any,
      status: initialStatus as any,
      endpoint: endpoint?.trim() || null,
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
    });

    // If a project was provided, link the resource to the project
    if (projectId && projectId.trim()) {
      try {
        await store.projectResources.create({
          projectId: projectId.trim(),
          resourceId: resource.id,
          allocatedBy: ownerId,
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
      const trimmedProjectId = projectId.trim();
      const project = await store.projects.findById(trimmedProjectId);
      if (organisation?.name && project?.name) {
        revalidatePath(`/orga/${organisation.name}/${project.name}`);
        console.log(`🔄 Revalidated project path for org ${organisation.name}, project ${project.name}`);
      }
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

    // Validate resource name format
    const nameValidation = validateNameFormat(name, 'resource');
    if (!nameValidation.isValid) {
      return {
        error: nameValidation.error || 'Invalid resource name',
        fieldErrors: { name: nameValidation.error || 'Invalid resource name' }
      };
    }

    if (!type) {
      return {
        error: 'Resource type is required',
        fieldErrors: { type: 'Resource type is required' }
      };
    }

    const store = await getStoreAsync();

    // Validate project if provided
    if (projectId && projectId.trim()) {
      const projectExists = await store.projects.findById(projectId);

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
    const currentResource = await store.resources.findById(resourceId);

    if (!currentResource) {
      return {
        error: 'Resource not found',
      };
    }

    // Check for duplicate resource name for the owner (excluding current resource)
    const ownerResources = await store.resources.findByOwnerId(currentResource.ownerId);
    const duplicateResource = ownerResources.find(
      r => r.name === name.trim() && r.isActive && r.id !== resourceId
    );

    if (duplicateResource) {
      return {
        error: 'You already have a resource with this name',
        fieldErrors: { name: 'You already have a resource with this name' }
      };
    }

    await store.resources.update(resourceId, {
      name: name.trim(),
      description: description?.trim() || null,
      type: type as any,
      status: status as any,
      endpoint: endpoint?.trim() || null,
      quotaLimit,
      isPublic,
      tags,
    });

    revalidatePath('/main/resources');

    const organisation = await store.organisations.findById(currentResource.organisationId);
    if (organisation?.name) {
      const resourceName = name.trim();
      const allocations = await store.projectResources.findByResourceId(resourceId);
      if (allocations.length === 0) {
        revalidatePath(`/orga/${organisation.name}`);
      } else {
        for (const allocation of allocations) {
          const project = await store.projects.findById(allocation.projectId);
          if (project?.name) {
            revalidatePath(`/orga/${organisation.name}/${project.name}`);
            revalidatePath(`/orga/${organisation.name}/${project.name}/${resourceName}`);
          }
        }
      }
    }

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
    const store = await getStoreAsync();
    const resource = await store.resources.findById(resourceId);

    await store.resources.update(resourceId, {
      isActive: false,
      deletedAt: new Date(),
    });

    revalidatePath('/main/resources');

    if (resource) {
      const organisation = await store.organisations.findById(resource.organisationId);
      if (organisation?.name) {
        revalidatePath(`/orga/${organisation.name}`);
        const allocations = await store.projectResources.findByResourceId(resourceId);
        for (const allocation of allocations) {
          const project = await store.projects.findById(allocation.projectId);
          if (project?.name) {
            revalidatePath(`/orga/${organisation.name}/${project.name}`);
          }
        }
      }
    }

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
    const store = await getStoreAsync();
    const resourceFound = await store.resources.findById(resourceId);
    const resource = resourceFound?.isActive ? resourceFound : null;

    if (!resource) {
      return { error: 'Resource not found' };
    }

    const organisation = await store.organisations.findById(resource.organisationId);

    // Check if project exists and belongs to same organisation
    const projectFound = await store.projects.findById(projectId);
    const project = projectFound?.isActive ? projectFound : null;

    if (!project) {
      return { error: 'Project not found' };
    }

    if (project.organisationId !== resource.organisationId) {
      return { error: 'Resource and project must belong to the same organisation' };
    }

    // Check if allocation already exists
    const existingAllocation = await store.projectResources.findByProjectAndResource(projectId, resourceId);

    if (existingAllocation) {
      return { error: 'Resource is already allocated to this project' };
    }

    // Create allocation
    await store.projectResources.create({
      projectId,
      resourceId,
      allocatedBy,
      quotaLimit
    });

    if (organisation?.name && project.name) {
      revalidatePath(`/orga/${organisation.name}/${project.name}/${resource.name}`);
      revalidatePath(`/orga/${organisation.name}/${project.name}`);
    }

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
    const store = await getStoreAsync();
    const allocation = await store.projectResources.findByProjectAndResource(projectId, resourceId);

    if (!allocation) {
      return { error: 'Allocation not found' };
    }

    await store.projectResources.delete(projectId, resourceId);

    const resource = await store.resources.findById(resourceId);
    const organisation = resource ? await store.organisations.findById(resource.organisationId) : null;
    const project = await store.projects.findById(projectId);

    if (organisation?.name && project?.name && resource?.name) {
      revalidatePath(`/orga/${organisation.name}/${project.name}/${resource.name}`);
      revalidatePath(`/orga/${organisation.name}/${project.name}`);
    }

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
    const store = await getStoreAsync();
    const allocation = await store.projectResources.findByProjectAndResource(projectId, resourceId);

    if (!allocation) {
      return { error: 'Allocation not found' };
    }

    await store.projectResources.update(projectId, resourceId, {
      quotaLimit
    });

    const resource = await store.resources.findById(resourceId);
    const organisation = resource ? await store.organisations.findById(resource.organisationId) : null;
    const project = await store.projects.findById(projectId);

    if (organisation?.name && project?.name && resource?.name) {
      revalidatePath(`/orga/${organisation.name}/${project.name}/${resource.name}`);
      revalidatePath(`/orga/${organisation.name}/${project.name}`);
    }

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
    const store = await getStoreAsync();
    const orgResources = await store.resources.findByOrgId(organisationId);
    const projectAllocations = await store.projectResources.findByProjectId(projectId);
    const allocatedResourceIds = new Set(projectAllocations.map(a => a.resourceId));

    const resources = orgResources
      .filter(r => r.isActive && !allocatedResourceIds.has(r.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        status: r.status,
        endpoint: r.endpoint,
        quotaLimit: r.quotaLimit,
        currentUsage: r.currentUsage
      }));

    return resources;
  } catch (error) {
    console.error('Failed to fetch available resources:', error);
    return [];
  }
}

// Search function for resources
export async function findResources(query: string, organisationId: string) {
  try {
    const store = await getStoreAsync();
    const orgResources = await store.resources.findByOrgId(organisationId);
    const lowerQuery = query.toLowerCase();

    const resources = orgResources
      .filter(r => r.isActive && (
        r.name.toLowerCase().includes(lowerQuery) ||
        (r.description && r.description.toLowerCase().includes(lowerQuery))
      ))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 10)
      .map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        type: r.type,
        status: r.status,
        endpoint: r.endpoint
      }));

    return resources;
  } catch (error) {
    console.error('Failed to search resources:', error);
    return [];
  }
}