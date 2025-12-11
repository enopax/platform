/**
 * Resource Model
 *
 * Data Access Layer for Resource entities using TinyBase.
 * Provides CRUD operations and custom query methods.
 */

import { BaseModel } from './base';

/**
 * Resource interface matching Prisma schema
 */
export interface Resource {
  id: string;
  name: string;
  description?: string | null;
  type?: ResourceType;
  status?: ResourceStatus;
  configuration?: Record<string, any> | null; // JSON
  endpoint?: string | null;
  credentials?: Record<string, any> | null; // JSON (encrypted in production)
  quotaLimit?: bigint | null;
  currentUsage?: bigint;
  ownerId: string;
  organisationId: string;
  isPublic?: boolean;
  tags?: string[];
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date | null;
}

/**
 * Resource Type enum
 */
export enum ResourceType {
  COMPUTE = 'COMPUTE',
  STORAGE = 'STORAGE',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  API = 'API',
  OTHER = 'OTHER',
}

/**
 * Resource Status enum
 */
export enum ResourceStatus {
  PROVISIONING = 'PROVISIONING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  DELETED = 'DELETED',
}

/**
 * Resource Model Class
 *
 * Provides data access methods for Resource entities.
 * Extends BaseModel for standard CRUD operations.
 */
export class ResourceModel extends BaseModel<Resource> {
  protected tableName = 'resources';

  /**
   * Override create to set default values
   */
  async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> {
    const resourceData = {
      ...data,
      type: data.type ?? ResourceType.OTHER,
      status: data.status ?? ResourceStatus.ACTIVE,
      currentUsage: data.currentUsage ?? BigInt(0),
      isPublic: data.isPublic ?? false,
      tags: data.tags ?? [],
      isActive: data.isActive ?? true,
    };

    return super.create(resourceData);
  }

  /**
   * Find resources by organisation ID
   * Uses TinyBase relationship for efficient lookup when available.
   *
   * @param organisationId - Organisation ID to search for
   * @returns Array of resources
   */
  async findByOrganisation(organisationId: string): Promise<Resource[]> {
    return this.findMany((resource) => resource.organisationId === organisationId);
  }

  /**
   * Find resource by name within an organisation
   *
   * @param name - Resource name to search for
   * @param organisationId - Organisation ID
   * @returns Resource or null if not found
   */
  async findByNameInOrganisation(name: string, organisationId: string): Promise<Resource | null> {
    const resources = await this.findMany(
      (resource) => resource.name === name && resource.organisationId === organisationId
    );
    return resources[0] || null;
  }

  /**
   * Find resources by owner (user who created the resource)
   *
   * @param ownerId - User ID
   * @returns Array of resources
   */
  async findByOwner(ownerId: string): Promise<Resource[]> {
    return this.findMany((resource) => resource.ownerId === ownerId);
  }

  /**
   * Find resources by type
   *
   * @param type - Resource type (STORAGE, DATABASE, etc.)
   * @returns Array of resources
   */
  async findByType(type: ResourceType): Promise<Resource[]> {
    return this.findMany((resource) => resource.type === type);
  }

  /**
   * Find resources by status
   *
   * @param status - Resource status (ACTIVE, PROVISIONING, etc.)
   * @returns Array of resources
   */
  async findByStatus(status: ResourceStatus): Promise<Resource[]> {
    return this.findMany((resource) => resource.status === status);
  }

  /**
   * Find resources by organisation and status
   *
   * @param organisationId - Organisation ID
   * @param status - Resource status
   * @returns Array of resources
   */
  async findByOrganisationAndStatus(
    organisationId: string,
    status: ResourceStatus
  ): Promise<Resource[]> {
    return this.findMany(
      (resource) => resource.organisationId === organisationId && resource.status === status
    );
  }

  /**
   * Find resources by organisation and type
   *
   * @param organisationId - Organisation ID
   * @param type - Resource type
   * @returns Array of resources
   */
  async findByOrganisationAndType(
    organisationId: string,
    type: ResourceType
  ): Promise<Resource[]> {
    return this.findMany(
      (resource) => resource.organisationId === organisationId && resource.type === type
    );
  }

  /**
   * Find active resources
   *
   * @returns Array of active resources
   */
  async findActive(): Promise<Resource[]> {
    return this.findMany((resource) => resource.isActive === true);
  }

  /**
   * Find inactive resources
   *
   * @returns Array of inactive resources
   */
  async findInactive(): Promise<Resource[]> {
    return this.findMany((resource) => resource.isActive === false);
  }

  /**
   * Find public resources (accessible within organisation)
   *
   * @returns Array of public resources
   */
  async findPublic(): Promise<Resource[]> {
    return this.findMany((resource) => resource.isPublic === true);
  }

  /**
   * Find private resources
   *
   * @returns Array of private resources
   */
  async findPrivate(): Promise<Resource[]> {
    return this.findMany((resource) => resource.isPublic === false);
  }

  /**
   * Find resources by tag
   *
   * @param tag - Tag to search for
   * @returns Array of resources with the tag
   */
  async findByTag(tag: string): Promise<Resource[]> {
    return this.findMany((resource) => resource.tags?.includes(tag) ?? false);
  }

  /**
   * Find resources provisioning (currently being deployed)
   *
   * @returns Array of provisioning resources
   */
  async findProvisioning(): Promise<Resource[]> {
    return this.findByStatus(ResourceStatus.PROVISIONING);
  }

  /**
   * Find resources in maintenance
   *
   * @returns Array of resources under maintenance
   */
  async findInMaintenance(): Promise<Resource[]> {
    return this.findByStatus(ResourceStatus.MAINTENANCE);
  }

  /**
   * Find soft-deleted resources
   *
   * @returns Array of soft-deleted resources
   */
  async findDeleted(): Promise<Resource[]> {
    return this.findMany((resource) => resource.deletedAt !== null && resource.deletedAt !== undefined);
  }

  /**
   * Get project IDs that this resource is allocated to
   * (Uses ProjectResource join table - placeholder for now)
   *
   * @param resourceId - Resource ID
   * @returns Array of project IDs
   */
  async getProjectIds(resourceId: string): Promise<string[]> {
    // TODO: Implement when ProjectResource model is created
    // This will query the project_resources join table
    return [];
  }

  /**
   * Check if resource name is available within organisation
   *
   * @param name - Resource name to check
   * @param organisationId - Organisation ID
   * @param excludeId - Optional resource ID to exclude (for updates)
   * @returns True if name is available
   */
  async isNameAvailable(
    name: string,
    organisationId: string,
    excludeId?: string
  ): Promise<boolean> {
    const existing = await this.findByNameInOrganisation(name, organisationId);
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  /**
   * Get resource usage percentage
   *
   * @param resourceId - Resource ID
   * @returns Usage percentage (0-100) or null if no quota limit
   */
  async getUsagePercentage(resourceId: string): Promise<number | null> {
    const resource = await this.findById(resourceId);
    if (!resource || !resource.quotaLimit) return null;

    const usage = Number(resource.currentUsage ?? BigInt(0));
    const limit = Number(resource.quotaLimit);

    if (limit === 0) return null;

    return Math.round((usage / limit) * 100);
  }
}

/**
 * Singleton instance
 */
export const resourceModel = new ResourceModel();
