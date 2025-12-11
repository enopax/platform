/**
 * Project Model Tests
 *
 * Unit tests for Project data access layer using TinyBase.
 * Tests all CRUD operations and custom query methods.
 */

import { projectModel, ProjectStatus, ProjectPriority } from '../project';
import { resetDB } from '@/lib/tinybase/db';
import { resetNanoid } from '../../../../tests/__mocks__/nanoid';

describe('ProjectModel', () => {
  beforeEach(async () => {
    await resetDB();
    resetNanoid();
  });

  describe('Basic CRUD Operations', () => {
    it('should create a project with minimal data', async () => {
      const project = await projectModel.create({
        name: 'New Website',
        organisationId: 'org1',
      });

      expect(project.id).toBe('test-id-000001');
      expect(project.name).toBe('New Website');
      expect(project.organisationId).toBe('org1');
      expect(project.createdAt).toBeInstanceOf(Date);
      expect(project.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a project with default values', async () => {
      const project = await projectModel.create({
        name: 'API Service',
        organisationId: 'org1',
      });

      expect(project.development).toBe(false);
      expect(project.status).toBe(ProjectStatus.PLANNING);
      expect(project.priority).toBe(ProjectPriority.MEDIUM);
      expect(project.currency).toBe('GBP');
      expect(project.progress).toBe(0);
      expect(project.isActive).toBe(true);
    });

    it('should create a project with all fields', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      const project = await projectModel.create({
        name: 'Mobile App',
        description: 'New mobile application',
        development: true,
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        budget: 50000,
        currency: 'USD',
        startDate,
        endDate,
        progress: 25,
        repositoryUrl: 'https://github.com/org/mobile-app',
        documentationUrl: 'https://docs.org/mobile-app',
        organisationId: 'org1',
        isActive: true,
      });

      expect(project.name).toBe('Mobile App');
      expect(project.description).toBe('New mobile application');
      expect(project.development).toBe(true);
      expect(project.status).toBe(ProjectStatus.ACTIVE);
      expect(project.priority).toBe(ProjectPriority.HIGH);
      expect(project.budget).toBe(50000);
      expect(project.currency).toBe('USD');
      expect(project.startDate).toEqual(startDate);
      expect(project.endDate).toEqual(endDate);
      expect(project.progress).toBe(25);
      expect(project.repositoryUrl).toBe('https://github.com/org/mobile-app');
      expect(project.documentationUrl).toBe('https://docs.org/mobile-app');
      expect(project.organisationId).toBe('org1');
      expect(project.isActive).toBe(true);
    });

    it('should find project by ID', async () => {
      const created = await projectModel.create({
        name: 'Database Migration',
        organisationId: 'org1',
      });

      const found = await projectModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.name).toBe('Database Migration');
    });

    it('should return null for non-existent project ID', async () => {
      const found = await projectModel.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('should update a project', async () => {
      const project = await projectModel.create({
        name: 'Infrastructure',
        organisationId: 'org1',
      });

      const updated = await projectModel.update(project.id, {
        name: 'Infrastructure v2',
        status: ProjectStatus.ACTIVE,
        progress: 50,
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Infrastructure v2');
      expect(updated?.status).toBe(ProjectStatus.ACTIVE);
      expect(updated?.progress).toBe(50);
      expect(updated?.updatedAt).toBeInstanceOf(Date);
    });

    it('should delete a project', async () => {
      const project = await projectModel.create({
        name: 'Deprecated System',
        organisationId: 'org1',
      });

      const deleted = await projectModel.delete(project.id);
      expect(deleted).toBe(true);

      const found = await projectModel.findById(project.id);
      expect(found).toBeNull();
    });
  });

  describe('Custom Query Methods', () => {
    beforeEach(async () => {
      // Create test projects
      await projectModel.create({
        name: 'Project A',
        organisationId: 'org1',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.HIGH,
        development: true,
      });

      await projectModel.create({
        name: 'Project B',
        organisationId: 'org1',
        status: ProjectStatus.PLANNING,
        priority: ProjectPriority.MEDIUM,
        development: false,
      });

      await projectModel.create({
        name: 'Project C',
        organisationId: 'org2',
        status: ProjectStatus.ACTIVE,
        priority: ProjectPriority.LOW,
        development: true,
      });

      await projectModel.create({
        name: 'Project D',
        organisationId: 'org1',
        status: ProjectStatus.COMPLETED,
        priority: ProjectPriority.HIGH,
        development: false,
        isActive: false,
      });
    });

    it('should find projects by organisation', async () => {
      const org1Projects = await projectModel.findByOrganisation('org1');
      expect(org1Projects).toHaveLength(3);
      expect(org1Projects.every((p) => p.organisationId === 'org1')).toBe(true);

      const org2Projects = await projectModel.findByOrganisation('org2');
      expect(org2Projects).toHaveLength(1);
      expect(org2Projects[0].name).toBe('Project C');
    });

    it('should find project by name in organisation', async () => {
      const project = await projectModel.findByNameInOrganisation('Project A', 'org1');
      expect(project).not.toBeNull();
      expect(project?.name).toBe('Project A');
      expect(project?.organisationId).toBe('org1');

      // Same name in different org should not be found
      const notFound = await projectModel.findByNameInOrganisation('Project C', 'org1');
      expect(notFound).toBeNull();
    });

    it('should find projects by status', async () => {
      const activeProjects = await projectModel.findByStatus(ProjectStatus.ACTIVE);
      expect(activeProjects).toHaveLength(2);
      expect(activeProjects.every((p) => p.status === ProjectStatus.ACTIVE)).toBe(true);

      const planningProjects = await projectModel.findByStatus(ProjectStatus.PLANNING);
      expect(planningProjects).toHaveLength(1);
      expect(planningProjects[0].name).toBe('Project B');

      const completedProjects = await projectModel.findByStatus(ProjectStatus.COMPLETED);
      expect(completedProjects).toHaveLength(1);
      expect(completedProjects[0].name).toBe('Project D');
    });

    it('should find projects by priority', async () => {
      const highPriorityProjects = await projectModel.findByPriority(ProjectPriority.HIGH);
      expect(highPriorityProjects).toHaveLength(2);
      expect(highPriorityProjects.every((p) => p.priority === ProjectPriority.HIGH)).toBe(true);

      const mediumPriorityProjects = await projectModel.findByPriority(ProjectPriority.MEDIUM);
      expect(mediumPriorityProjects).toHaveLength(1);
      expect(mediumPriorityProjects[0].name).toBe('Project B');

      const lowPriorityProjects = await projectModel.findByPriority(ProjectPriority.LOW);
      expect(lowPriorityProjects).toHaveLength(1);
      expect(lowPriorityProjects[0].name).toBe('Project C');
    });

    it('should find active projects', async () => {
      const activeProjects = await projectModel.findActive();
      expect(activeProjects).toHaveLength(3);
      expect(activeProjects.every((p) => p.isActive === true)).toBe(true);
    });

    it('should find inactive projects', async () => {
      const inactiveProjects = await projectModel.findInactive();
      expect(inactiveProjects).toHaveLength(1);
      expect(inactiveProjects[0].name).toBe('Project D');
    });

    it('should find development projects', async () => {
      const devProjects = await projectModel.findDevelopment();
      expect(devProjects).toHaveLength(2);
      expect(devProjects.every((p) => p.development === true)).toBe(true);
    });

    it('should find production projects', async () => {
      const prodProjects = await projectModel.findProduction();
      expect(prodProjects).toHaveLength(2);
      expect(prodProjects.every((p) => p.development === false)).toBe(true);
    });

    it('should find projects by organisation and status', async () => {
      const org1ActiveProjects = await projectModel.findByOrganisationAndStatus(
        'org1',
        ProjectStatus.ACTIVE
      );
      expect(org1ActiveProjects).toHaveLength(1);
      expect(org1ActiveProjects[0].name).toBe('Project A');

      const org1PlanningProjects = await projectModel.findByOrganisationAndStatus(
        'org1',
        ProjectStatus.PLANNING
      );
      expect(org1PlanningProjects).toHaveLength(1);
      expect(org1PlanningProjects[0].name).toBe('Project B');
    });
  });

  describe('Name Availability', () => {
    beforeEach(async () => {
      await projectModel.create({
        name: 'Existing Project',
        organisationId: 'org1',
      });
    });

    it('should return true for available name', async () => {
      const available = await projectModel.isNameAvailable('New Project', 'org1');
      expect(available).toBe(true);
    });

    it('should return false for taken name in same organisation', async () => {
      const available = await projectModel.isNameAvailable('Existing Project', 'org1');
      expect(available).toBe(false);
    });

    it('should return true for same name in different organisation', async () => {
      const available = await projectModel.isNameAvailable('Existing Project', 'org2');
      expect(available).toBe(true);
    });

    it('should return true when checking existing project name (update scenario)', async () => {
      const project = await projectModel.findByNameInOrganisation('Existing Project', 'org1');
      const available = await projectModel.isNameAvailable(
        'Existing Project',
        'org1',
        project!.id
      );
      expect(available).toBe(true);
    });

    it('should return false when updating to another taken name', async () => {
      await projectModel.create({
        name: 'Another Project',
        organisationId: 'org1',
      });

      const project = await projectModel.findByNameInOrganisation('Existing Project', 'org1');
      const available = await projectModel.isNameAvailable(
        'Another Project',
        'org1',
        project!.id
      );
      expect(available).toBe(false);
    });
  });

  describe('Relationship Methods (Placeholders)', () => {
    it('should return empty array for getResourceIds (placeholder)', async () => {
      const project = await projectModel.create({
        name: 'Test Project',
        organisationId: 'org1',
      });

      const resourceIds = await projectModel.getResourceIds(project.id);
      expect(resourceIds).toEqual([]);
    });

    it('should return empty array for getTeamIds (placeholder)', async () => {
      const project = await projectModel.create({
        name: 'Test Project',
        organisationId: 'org1',
      });

      const teamIds = await projectModel.getTeamIds(project.id);
      expect(teamIds).toEqual([]);
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      await projectModel.create({
        name: 'Project 1',
        organisationId: 'org1',
      });
      await projectModel.create({
        name: 'Project 2',
        organisationId: 'org1',
      });
      await projectModel.create({
        name: 'Project 3',
        organisationId: 'org2',
      });
    });

    it('should count all projects', async () => {
      const count = await projectModel.count();
      expect(count).toBe(3);
    });

    it('should check if project exists', async () => {
      const project = await projectModel.findByNameInOrganisation('Project 1', 'org1');
      const exists = await projectModel.exists(project!.id);
      expect(exists).toBe(true);

      const notExists = await projectModel.exists('non-existent-id');
      expect(notExists).toBe(false);
    });
  });

  describe('Enums', () => {
    it('should have all ProjectStatus values', () => {
      expect(ProjectStatus.PLANNING).toBe('PLANNING');
      expect(ProjectStatus.ACTIVE).toBe('ACTIVE');
      expect(ProjectStatus.ON_HOLD).toBe('ON_HOLD');
      expect(ProjectStatus.COMPLETED).toBe('COMPLETED');
      expect(ProjectStatus.CANCELLED).toBe('CANCELLED');
    });

    it('should have all ProjectPriority values', () => {
      expect(ProjectPriority.LOW).toBe('LOW');
      expect(ProjectPriority.MEDIUM).toBe('MEDIUM');
      expect(ProjectPriority.HIGH).toBe('HIGH');
      expect(ProjectPriority.URGENT).toBe('URGENT');
    });
  });

  describe('Date Handling', () => {
    it('should handle date fields correctly', async () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');
      const actualEndDate = new Date('2025-11-30');

      const project = await projectModel.create({
        name: 'Date Project',
        organisationId: 'org1',
        startDate,
        endDate,
        actualEndDate,
      });

      expect(project.startDate).toEqual(startDate);
      expect(project.endDate).toEqual(endDate);
      expect(project.actualEndDate).toEqual(actualEndDate);

      // Verify dates persist after retrieval
      const found = await projectModel.findById(project.id);
      expect(found?.startDate).toEqual(startDate);
      expect(found?.endDate).toEqual(endDate);
      expect(found?.actualEndDate).toEqual(actualEndDate);
    });

    it('should handle null date fields', async () => {
      const project = await projectModel.create({
        name: 'No Dates Project',
        organisationId: 'org1',
        startDate: null,
        endDate: null,
        actualEndDate: null,
      });

      expect(project.startDate).toBeNull();
      expect(project.endDate).toBeNull();
      expect(project.actualEndDate).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null optional fields', async () => {
      const project = await projectModel.create({
        name: 'Minimal Project',
        organisationId: 'org1',
        description: null,
        budget: null,
        currency: null,
        startDate: null,
        endDate: null,
        actualEndDate: null,
        repositoryUrl: null,
        documentationUrl: null,
      });

      expect(project.description).toBeNull();
      expect(project.budget).toBeNull();
      expect(project.startDate).toBeNull();
      expect(project.endDate).toBeNull();
      expect(project.actualEndDate).toBeNull();
      expect(project.repositoryUrl).toBeNull();
      expect(project.documentationUrl).toBeNull();
    });

    it('should handle progress values (0-100)', async () => {
      const project1 = await projectModel.create({
        name: 'Project 0%',
        organisationId: 'org1',
        progress: 0,
      });
      expect(project1.progress).toBe(0);

      const project2 = await projectModel.create({
        name: 'Project 50%',
        organisationId: 'org1',
        progress: 50,
      });
      expect(project2.progress).toBe(50);

      const project3 = await projectModel.create({
        name: 'Project 100%',
        organisationId: 'org1',
        progress: 100,
      });
      expect(project3.progress).toBe(100);
    });

    it('should handle budget values', async () => {
      const project1 = await projectModel.create({
        name: 'Small Budget',
        organisationId: 'org1',
        budget: 1000,
      });
      expect(project1.budget).toBe(1000);

      const project2 = await projectModel.create({
        name: 'Large Budget',
        organisationId: 'org1',
        budget: 1000000,
      });
      expect(project2.budget).toBe(1000000);

      const project3 = await projectModel.create({
        name: 'No Budget',
        organisationId: 'org1',
        budget: null,
      });
      expect(project3.budget).toBeNull();
    });

    it('should handle empty and non-empty URLs', async () => {
      const project = await projectModel.create({
        name: 'URLs Project',
        organisationId: 'org1',
        repositoryUrl: 'https://github.com/org/repo',
        documentationUrl: 'https://docs.org/project',
      });

      expect(project.repositoryUrl).toBe('https://github.com/org/repo');
      expect(project.documentationUrl).toBe('https://docs.org/project');
    });
  });
});
