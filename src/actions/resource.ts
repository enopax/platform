'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

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
    teamId?: string;
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
    const teamId = formData.get('teamId') as string;
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

    if (!ownerId) {
      return {
        error: 'Owner is required',
        fieldErrors: { ownerId: 'Owner is required' }
      };
    }

    if (!teamId) {
      return {
        error: 'Team is required',
        fieldErrors: { teamId: 'Team is required' }
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

    // Validate team exists and user has access
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          select: { userId: true }
        }
      }
    });

    if (!team) {
      return {
        error: 'Selected team does not exist',
        fieldErrors: { teamId: 'Selected team does not exist' }
      };
    }

    // Check if user is team owner or member
    const isTeamOwner = team.ownerId === ownerId;
    const isTeamMember = team.members.some(member => member.userId === ownerId);

    if (!isTeamOwner && !isTeamMember) {
      return {
        error: 'You do not have access to this team',
        fieldErrors: { teamId: 'You do not have access to this team' }
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

    const resource = await prisma.resource.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        type: type as any,
        status: (status || 'ACTIVE') as any,
        endpoint: endpoint?.trim() || null,
        quotaLimit,
        ownerId,
        projectId: projectId?.trim() || null,
        isPublic,
        tags,
        // Note: teamId might need schema update to be directly stored
        // For now storing team information through validation above
      },
    });

    revalidatePath('/main/resources');

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

// Search function for resources
export async function findResources(query: string, userId: string) {
  try {
    const resources = await prisma.resource.findMany({
      where: {
        AND: [
          {
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
          {
            OR: [
              // Resources owned by the user
              { ownerId: userId },
              // Resources managed by teams the user is a member of (through projects)
              {
                project: {
                  team: {
                    OR: [
                      {
                        members: {
                          some: { userId }
                        }
                      },
                      { ownerId: userId }
                    ]
                  }
                }
              },
              // Public resources
              { isPublic: true }
            ]
          },
          { isActive: true }
        ]
      },
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        status: true,
        owner: {
          select: {
            name: true,
            email: true,
          },
        },
        project: {
          select: {
            name: true,
            team: {
              select: {
                name: true,
              },
            },
          },
        },
        createdAt: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 10,
    });

    return resources;
  } catch (error) {
    console.error('Failed to search resources:', error);
    return [];
  }
}