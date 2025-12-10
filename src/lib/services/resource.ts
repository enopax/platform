import { PrismaClient, Resource, ResourceType, ResourceStatus } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateResourceData {
  name: string;
  description?: string;
  type: ResourceType;
  status?: ResourceStatus;
  configuration?: any;
  endpoint?: string;
  credentials?: any;
  quotaLimit?: bigint;
  ownerId: string;
  organisationId: string;
  isPublic?: boolean;
  tags?: string[];
}

export interface UpdateResourceData {
  name?: string;
  description?: string;
  type?: ResourceType;
  status?: ResourceStatus;
  configuration?: any;
  endpoint?: string;
  credentials?: any;
  quotaLimit?: bigint;
  currentUsage?: bigint;
  isPublic?: boolean;
  tags?: string[];
}

export interface ResourceInfo extends Resource {
  allocatedProjectCount?: number;
}

export class ResourceService {
  async createResource(data: CreateResourceData): Promise<Resource> {
    try {
      return await prisma.resource.create({
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status || ResourceStatus.ACTIVE,
          configuration: data.configuration,
          endpoint: data.endpoint,
          credentials: data.credentials,
          quotaLimit: data.quotaLimit,
          ownerId: data.ownerId,
          organisationId: data.organisationId,
          isPublic: data.isPublic ?? false,
          tags: data.tags || [],
        },
      });
    } catch (error) {
      console.error('Failed to create resource:', error);
      throw error;
    }
  }

  async getResourceById(resourceId: string): Promise<ResourceInfo | null> {
    try {
      const resource = await prisma.resource.findUnique({
        where: { id: resourceId },
        include: {
          _count: {
            select: {
              allocatedProjects: true,
            },
          },
        },
      });

      if (!resource) {
        return null;
      }

      return {
        ...resource,
        allocatedProjectCount: resource._count.allocatedProjects,
      };
    } catch (error) {
      console.error('Failed to get resource by ID:', error);
      throw error;
    }
  }

  async getAllResources(): Promise<Resource[]> {
    try {
      return await prisma.resource.findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get all resources:', error);
      throw error;
    }
  }

  async getOrganisationResources(organisationId: string): Promise<Resource[]> {
    try {
      return await prisma.resource.findMany({
        where: {
          organisationId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get organisation resources:', error);
      throw error;
    }
  }

  async getProjectResources(projectId: string): Promise<Resource[]> {
    try {
      const allocations = await prisma.projectResource.findMany({
        where: { projectId },
        include: {
          resource: true,
        },
      });

      return allocations.map(allocation => allocation.resource);
    } catch (error) {
      console.error('Failed to get project resources:', error);
      throw error;
    }
  }

  async getResourcesByStatus(status: ResourceStatus): Promise<Resource[]> {
    try {
      return await prisma.resource.findMany({
        where: {
          status,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get resources by status:', error);
      throw error;
    }
  }

  async updateResource(resourceId: string, data: UpdateResourceData): Promise<Resource> {
    try {
      return await prisma.resource.update({
        where: { id: resourceId },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          status: data.status,
          configuration: data.configuration,
          endpoint: data.endpoint,
          credentials: data.credentials,
          quotaLimit: data.quotaLimit,
          currentUsage: data.currentUsage,
          isPublic: data.isPublic,
          tags: data.tags,
        },
      });
    } catch (error) {
      console.error('Failed to update resource:', error);
      throw error;
    }
  }

  async deleteResource(resourceId: string): Promise<void> {
    try {
      await prisma.resource.update({
        where: { id: resourceId },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to delete resource:', error);
      throw error;
    }
  }

  async allocateResourceToProject(
    resourceId: string,
    projectId: string,
    allocatedBy: string,
    quotaLimit?: bigint
  ): Promise<void> {
    try {
      await prisma.projectResource.create({
        data: {
          resourceId,
          projectId,
          allocatedBy,
          quotaLimit,
        },
      });
    } catch (error) {
      console.error('Failed to allocate resource to project:', error);
      throw error;
    }
  }

  async removeResourceFromProject(resourceId: string, projectId: string): Promise<void> {
    try {
      await prisma.projectResource.delete({
        where: {
          projectId_resourceId: {
            projectId,
            resourceId,
          },
        },
      });
    } catch (error) {
      console.error('Failed to remove resource from project:', error);
      throw error;
    }
  }

  async searchResources(query: string, limit: number = 10): Promise<Resource[]> {
    try {
      return await prisma.resource.findMany({
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
        orderBy: { name: 'asc' },
        take: limit,
      });
    } catch (error) {
      console.error('Failed to search resources:', error);
      return [];
    }
  }
}

export const resourceService = new ResourceService();
