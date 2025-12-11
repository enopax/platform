/**
 * Team Model
 *
 * Data Access Layer for Team entities using TinyBase.
 * Provides CRUD operations and custom query methods.
 */

import { BaseModel } from './base';

/**
 * Team interface matching Prisma schema
 */
export interface Team {
  id: string;
  name: string;
  description?: string | null;
  teamType?: TeamType;
  color?: string | null;
  isActive?: boolean;
  isPersonal?: boolean;
  isDeletable?: boolean;
  isDefault?: boolean;
  visibility?: TeamVisibility;
  allowJoinRequests?: boolean;
  maxMembers?: number | null;
  tags?: string[];
  organisationId: string;
  ownerId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Team Type enum
 */
export enum TeamType {
  ADMIN = 'ADMIN',
  DEV = 'DEV',
  GUEST = 'GUEST',
  CUSTOM = 'CUSTOM',
}

/**
 * Team Visibility enum
 */
export enum TeamVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  INVITE_ONLY = 'INVITE_ONLY',
}

/**
 * Team Role enum
 */
export enum TeamRole {
  MEMBER = 'MEMBER',
  LEAD = 'LEAD',
  ADMIN = 'ADMIN',
}

/**
 * Team Model Class
 *
 * Provides data access methods for Team entities.
 * Extends BaseModel for standard CRUD operations.
 */
export class TeamModel extends BaseModel<Team> {
  protected tableName = 'teams';

  /**
   * Find teams by organisation ID
   * Uses TinyBase relationship for efficient lookup when available.
   *
   * @param organisationId - Organisation ID to search for
   * @returns Array of teams
   */
  async findByOrganisation(organisationId: string): Promise<Team[]> {
    return this.findMany((team) => team.organisationId === organisationId);
  }

  /**
   * Find team by name within an organisation (team names are unique per organisation)
   *
   * @param name - Team name to search for
   * @param organisationId - Organisation ID
   * @returns Team or null if not found
   */
  async findByNameInOrganisation(name: string, organisationId: string): Promise<Team | null> {
    const teams = await this.findMany(
      (team) => team.name === name && team.organisationId === organisationId
    );
    return teams[0] || null;
  }

  /**
   * Find teams by owner ID
   *
   * @param ownerId - User ID of the owner
   * @returns Array of teams
   */
  async findByOwner(ownerId: string): Promise<Team[]> {
    return this.findMany((team) => team.ownerId === ownerId);
  }

  /**
   * Find active teams
   *
   * @returns Array of active teams
   */
  async findActive(): Promise<Team[]> {
    return this.findMany((team) => team.isActive === true);
  }

  /**
   * Find inactive teams
   *
   * @returns Array of inactive teams
   */
  async findInactive(): Promise<Team[]> {
    return this.findMany((team) => team.isActive === false);
  }

  /**
   * Find teams by type
   *
   * @param teamType - Team type to filter by
   * @returns Array of teams with the specified type
   */
  async findByType(teamType: TeamType): Promise<Team[]> {
    return this.findMany((team) => team.teamType === teamType);
  }

  /**
   * Find teams by visibility
   *
   * @param visibility - Team visibility to filter by
   * @returns Array of teams with the specified visibility
   */
  async findByVisibility(visibility: TeamVisibility): Promise<Team[]> {
    return this.findMany((team) => team.visibility === visibility);
  }

  /**
   * Find personal teams
   *
   * @returns Array of personal teams
   */
  async findPersonal(): Promise<Team[]> {
    return this.findMany((team) => team.isPersonal === true);
  }

  /**
   * Find default teams
   *
   * @returns Array of default teams
   */
  async findDefault(): Promise<Team[]> {
    return this.findMany((team) => team.isDefault === true);
  }

  /**
   * Find deletable teams
   *
   * @returns Array of deletable teams
   */
  async findDeletable(): Promise<Team[]> {
    return this.findMany((team) => team.isDeletable === true);
  }

  /**
   * Get members for a team
   * Note: This returns empty array in test environment.
   * In production, members should be queried via MembershipModel.findByTeam(teamId)
   *
   * @param teamId - Team ID
   * @returns Array of member IDs (empty in tests)
   */
  async getMemberIds(teamId: string): Promise<string[]> {
    // To be implemented with MembershipModel relationship
    return [];
  }

  /**
   * Get projects assigned to a team
   * Note: This returns empty array in test environment.
   * In production, projects should be queried via ProjectTeamModel.findByTeam(teamId)
   *
   * @param teamId - Team ID
   * @returns Array of project IDs (empty in tests)
   */
  async getProjectIds(teamId: string): Promise<string[]> {
    // To be implemented with ProjectTeamModel relationship
    return [];
  }

  /**
   * Check if team name is available within an organisation
   *
   * @param name - Team name to check
   * @param organisationId - Organisation ID
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @returns true if name is available, false if taken
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
   * Override create to set default values
   */
  async create(data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    const teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      teamType: data.teamType ?? TeamType.CUSTOM,
      isActive: data.isActive ?? true,
      isPersonal: data.isPersonal ?? false,
      isDeletable: data.isDeletable ?? true,
      isDefault: data.isDefault ?? false,
      visibility: data.visibility ?? TeamVisibility.PRIVATE,
      allowJoinRequests: data.allowJoinRequests ?? true,
      tags: data.tags ?? [],
    };

    return super.create(teamData);
  }
}

/**
 * Singleton instance
 */
export const teamModel = new TeamModel();
