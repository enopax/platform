/**
 * Organisation Model
 *
 * Data Access Layer for Organisation entities using TinyBase.
 * Provides CRUD operations and custom query methods.
 */

import { BaseModel } from './base';

/**
 * Organisation interface matching Prisma schema
 */
export interface Organisation {
  id: string;
  name: string;
  description?: string | null;
  website?: string | null;

  // Address Information
  streetAddress?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;

  // Contact Information
  phone?: string | null;
  email?: string | null;
  logo?: string | null;

  // Billing Information
  vatNumber?: string | null;
  taxId?: string | null;
  billingEmail?: string | null;
  paymentMethods?: Record<string, unknown> | null; // JSON field

  // Subscription and Billing
  subscriptionId?: string | null;
  subscriptionTier?: string | null;
  subscriptionEnds?: Date | null;

  // Organisation Settings
  isActive?: boolean;
  maxTeams?: number | null;
  maxProjects?: number | null;
  maxMembers?: number | null;

  // Ownership
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Organisation Role enum
 */
export enum OrganisationRole {
  MEMBER = 'MEMBER',
  MANAGER = 'MANAGER',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
}

/**
 * Organisation Model Class
 *
 * Provides data access methods for Organisation entities.
 * Extends BaseModel for standard CRUD operations.
 */
export class OrganisationModel extends BaseModel<Organisation> {
  protected tableName = 'organisations';

  /**
   * Find organisation by name (case-sensitive)
   * Uses TinyBase index for efficient lookup when available.
   *
   * @param name - Organisation name to search for
   * @returns Organisation or null if not found
   */
  async findByName(name: string): Promise<Organisation | null> {
    // Fallback to findMany for now (index optimization can be added later)
    const orgs = await this.findMany((org) => org.name === name);
    return orgs[0] || null;
  }

  /**
   * Find all organisations owned by a specific user
   *
   * @param ownerId - User ID of the owner
   * @returns Array of organisations
   */
  async findByOwner(ownerId: string): Promise<Organisation[]> {
    return this.findMany((org) => org.ownerId === ownerId);
  }

  /**
   * Find active organisations
   *
   * @returns Array of active organisations
   */
  async findActive(): Promise<Organisation[]> {
    return this.findMany((org) => org.isActive === true);
  }

  /**
   * Find inactive organisations
   *
   * @returns Array of inactive organisations
   */
  async findInactive(): Promise<Organisation[]> {
    return this.findMany((org) => org.isActive === false);
  }

  /**
   * Find organisations by subscription tier
   *
   * @param tier - Subscription tier to filter by
   * @returns Array of organisations with the specified tier
   */
  async findBySubscriptionTier(tier: string): Promise<Organisation[]> {
    return this.findMany((org) => org.subscriptionTier === tier);
  }

  /**
   * Get teams for an organisation
   * Note: This returns empty array in test environment.
   * In production, teams should be queried via TeamModel.findByOrganisation(orgId)
   *
   * @param orgId - Organisation ID
   * @returns Array of team IDs (empty in tests)
   */
  async getTeamIds(orgId: string): Promise<string[]> {
    // To be implemented with TeamModel relationship
    return [];
  }

  /**
   * Get projects for an organisation
   * Note: This returns empty array in test environment.
   * In production, projects should be queried via ProjectModel.findByOrganisation(orgId)
   *
   * @param orgId - Organisation ID
   * @returns Array of project IDs (empty in tests)
   */
  async getProjectIds(orgId: string): Promise<string[]> {
    // To be implemented with ProjectModel relationship
    return [];
  }

  /**
   * Get resources for an organisation
   * Note: This returns empty array in test environment.
   * In production, resources should be queried via ResourceModel.findByOrganisation(orgId)
   *
   * @param orgId - Organisation ID
   * @returns Array of resource IDs (empty in tests)
   */
  async getResourceIds(orgId: string): Promise<string[]> {
    // To be implemented with ResourceModel relationship
    return [];
  }

  /**
   * Check if organisation name is available
   *
   * @param name - Organisation name to check
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @returns true if name is available, false if taken
   */
  async isNameAvailable(name: string, excludeId?: string): Promise<boolean> {
    const existing = await this.findByName(name);
    if (!existing) return true;
    if (excludeId && existing.id === excludeId) return true;
    return false;
  }

  /**
   * Override create to set default values
   */
  async create(data: Omit<Organisation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organisation> {
    const orgData: Omit<Organisation, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      country: data.country ?? 'United Kingdom',
      subscriptionTier: data.subscriptionTier ?? 'FREE',
      isActive: data.isActive ?? true,
      maxTeams: data.maxTeams ?? 10,
      maxProjects: data.maxProjects ?? 50,
      maxMembers: data.maxMembers ?? 100,
    };

    return super.create(orgData);
  }
}

/**
 * Singleton instance
 */
export const organisationModel = new OrganisationModel();
