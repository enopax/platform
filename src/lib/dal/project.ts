/**
 * Project Model
 *
 * Data Access Layer for Project entities using TinyBase.
 * Provides CRUD operations and custom query methods.
 */

import { BaseModel } from './base';

/**
 * Project interface matching Prisma schema
 */
export interface Project {
  id: string;
  name: string;
  description?: string | null;
  development?: boolean;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  budget?: number | null; // Decimal as number (precision handled in DB layer)
  currency?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  actualEndDate?: Date | null;
  progress?: number;
  repositoryUrl?: string | null;
  documentationUrl?: string | null;
  organisationId: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Project Status enum
 */
export enum ProjectStatus {
  PLANNING = 'PLANNING',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * Project Priority enum
 */
export enum ProjectPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/**
 * Project Model Class
 *
 * Provides data access methods for Project entities.
 * Extends BaseModel for standard CRUD operations.
 */
export class ProjectModel extends BaseModel<Project> {
  protected tableName = 'projects';

  /**
   * Override create to set default values
   */
  async create(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const projectData = {
      ...data,
      development: data.development ?? false,
      status: data.status ?? ProjectStatus.PLANNING,
      priority: data.priority ?? ProjectPriority.MEDIUM,
      currency: data.currency ?? 'GBP',
      progress: data.progress ?? 0,
      isActive: data.isActive ?? true,
    };

    return super.create(projectData);
  }

  /**
   * Find projects by organisation ID
   * Uses TinyBase relationship for efficient lookup when available.
   *
   * @param organisationId - Organisation ID to search for
   * @returns Array of projects
   */
  async findByOrganisation(organisationId: string): Promise<Project[]> {
    return this.findMany((project) => project.organisationId === organisationId);
  }

  /**
   * Find project by name within an organisation (project names are unique per organisation)
   *
   * @param name - Project name to search for
   * @param organisationId - Organisation ID
   * @returns Project or null if not found
   */
  async findByNameInOrganisation(name: string, organisationId: string): Promise<Project | null> {
    const projects = await this.findMany(
      (project) => project.name === name && project.organisationId === organisationId
    );
    return projects[0] || null;
  }

  /**
   * Find projects by status
   *
   * @param status - Project status to filter by
   * @returns Array of projects
   */
  async findByStatus(status: ProjectStatus): Promise<Project[]> {
    return this.findMany((project) => project.status === status);
  }

  /**
   * Find projects by priority
   *
   * @param priority - Project priority to filter by
   * @returns Array of projects
   */
  async findByPriority(priority: ProjectPriority): Promise<Project[]> {
    return this.findMany((project) => project.priority === priority);
  }

  /**
   * Find active projects
   *
   * @returns Array of active projects
   */
  async findActive(): Promise<Project[]> {
    return this.findMany((project) => project.isActive === true);
  }

  /**
   * Find inactive projects
   *
   * @returns Array of inactive projects
   */
  async findInactive(): Promise<Project[]> {
    return this.findMany((project) => project.isActive === false);
  }

  /**
   * Find development projects
   *
   * @returns Array of development projects
   */
  async findDevelopment(): Promise<Project[]> {
    return this.findMany((project) => project.development === true);
  }

  /**
   * Find production projects
   *
   * @returns Array of production projects
   */
  async findProduction(): Promise<Project[]> {
    return this.findMany((project) => project.development === false);
  }

  /**
   * Find projects by status within an organisation
   *
   * @param organisationId - Organisation ID
   * @param status - Project status
   * @returns Array of projects
   */
  async findByOrganisationAndStatus(
    organisationId: string,
    status: ProjectStatus
  ): Promise<Project[]> {
    return this.findMany(
      (project) => project.organisationId === organisationId && project.status === status
    );
  }

  /**
   * Get resource IDs for a project
   * Placeholder - will use TinyBase relationships when Resource model is implemented
   *
   * @param projectId - Project ID
   * @returns Array of resource IDs
   */
  async getResourceIds(projectId: string): Promise<string[]> {
    // TODO: Implement using TinyBase relationships once Resource model is implemented
    // const db = await getDB();
    // return db.relationships.getLocalRowIds('projectResource', projectId);
    return [];
  }

  /**
   * Get team IDs assigned to a project
   * Placeholder - will use TinyBase relationships when ProjectTeam model is implemented
   *
   * @param projectId - Project ID
   * @returns Array of team IDs
   */
  async getTeamIds(projectId: string): Promise<string[]> {
    // TODO: Implement using TinyBase relationships once ProjectTeam model is implemented
    // const db = await getDB();
    // return db.relationships.getLocalRowIds('projectTeam', projectId);
    return [];
  }

  /**
   * Check if project name is available within an organisation
   *
   * @param name - Project name to check
   * @param organisationId - Organisation ID
   * @param excludeId - Optional project ID to exclude from check (for updates)
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
}

/**
 * Singleton instance of ProjectModel
 */
export const projectModel = new ProjectModel();
