import { createTestStore } from './helpers';
import { setStore, resetStore } from '@/lib/store/data-store';
import { ProjectService } from '@/lib/services/project';
import { OrganisationService } from '@/lib/services/organisation';
import { UserService } from '@/lib/services/user';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let orgService: OrganisationService;
  let userService: UserService;
  let ownerId: string;
  let nonMemberId: string;
  let orgId: string;

  beforeEach(async () => {
    resetStore();
    setStore(createTestStore());
    projectService = new ProjectService();
    orgService = new OrganisationService();
    userService = new UserService();

    const owner = await userService.createUser({ email: 'owner@example.com' });
    const nonMember = await userService.createUser({ email: 'outsider@example.com' });
    ownerId = owner.id;
    nonMemberId = nonMember.id;

    const org = await orgService.createOrganisation(ownerId, { name: 'test-org' });
    orgId = org.id;
  });

  describe('createProject', () => {
    it('creates a project for org member', async () => {
      const project = await projectService.createProject(ownerId, {
        name: 'my-project',
        organisationId: orgId,
      });
      expect(project.name).toBe('my-project');
      expect(project.status).toBe('PLANNING');
      expect(project.organisation?.name).toBe('test-org');
    });

    it('rejects non-member creating project', async () => {
      await expect(
        projectService.createProject(nonMemberId, { name: 'hack', organisationId: orgId })
      ).rejects.toThrow('not a member');
    });

    it('rejects duplicate project name within org', async () => {
      await projectService.createProject(ownerId, { name: 'unique-name', organisationId: orgId });
      await expect(
        projectService.createProject(ownerId, { name: 'unique-name', organisationId: orgId })
      ).rejects.toThrow('already exists');
    });
  });

  describe('getProjectById', () => {
    it('returns project with org info', async () => {
      const created = await projectService.createProject(ownerId, { name: 'sample-project', organisationId: orgId });
      const found = await projectService.getProjectById(created.id);
      expect(found).not.toBeNull();
      expect(found!.organisation?.name).toBe('test-org');
    });

    it('returns null for missing project', async () => {
      expect(await projectService.getProjectById('nonexistent')).toBeNull();
    });
  });

  describe('getOrganisationProjects', () => {
    it('returns active projects for org', async () => {
      await projectService.createProject(ownerId, { name: 'proj-1', organisationId: orgId });
      await projectService.createProject(ownerId, { name: 'proj-2', organisationId: orgId });

      const projects = await projectService.getOrganisationProjects(orgId);
      expect(projects).toHaveLength(2);
    });
  });

  describe('getUserProjects', () => {
    it('returns projects across all user orgs', async () => {
      const org2 = await orgService.createOrganisation(ownerId, { name: 'org-2' });
      await projectService.createProject(ownerId, { name: 'proj-1', organisationId: orgId });
      await projectService.createProject(ownerId, { name: 'proj-2', organisationId: org2.id });

      const projects = await projectService.getUserProjects(ownerId);
      expect(projects).toHaveLength(2);
    });

    it('returns empty for user with no orgs', async () => {
      const projects = await projectService.getUserProjects(nonMemberId);
      expect(projects).toEqual([]);
    });
  });

  describe('updateProject', () => {
    it('allows org member to update', async () => {
      const project = await projectService.createProject(ownerId, { name: 'old-name', organisationId: orgId });
      const updated = await projectService.updateProject(ownerId, project.id, { name: 'renamed', status: 'ACTIVE' });
      expect(updated.name).toBe('renamed');
      expect(updated.status).toBe('ACTIVE');
    });

    it('rejects non-member update', async () => {
      const project = await projectService.createProject(ownerId, { name: 'sample-project', organisationId: orgId });
      await expect(
        projectService.updateProject(nonMemberId, project.id, { name: 'hacked' })
      ).rejects.toThrow('permission');
    });

    it('rejects duplicate name on rename', async () => {
      await projectService.createProject(ownerId, { name: 'existing', organisationId: orgId });
      const project = await projectService.createProject(ownerId, { name: 'to-rename', organisationId: orgId });

      await expect(
        projectService.updateProject(ownerId, project.id, { name: 'existing' })
      ).rejects.toThrow('already exists');
    });
  });

  describe('deleteProject', () => {
    it('soft deletes project', async () => {
      const project = await projectService.createProject(ownerId, { name: 'to-delete', organisationId: orgId });
      await projectService.deleteProject(ownerId, project.id);

      const found = await projectService.getProjectById(project.id);
      expect(found!.isActive).toBe(false);
    });

    it('rejects non-member delete', async () => {
      const project = await projectService.createProject(ownerId, { name: 'sample-project', organisationId: orgId });
      await expect(
        projectService.deleteProject(nonMemberId, project.id)
      ).rejects.toThrow('permission');
    });
  });

  describe('canUserAccessProject', () => {
    it('returns true for org member', async () => {
      const project = await projectService.createProject(ownerId, { name: 'sample-project', organisationId: orgId });
      expect(await projectService.canUserAccessProject(ownerId, project.id)).toBe(true);
    });

    it('returns false for non-member', async () => {
      const project = await projectService.createProject(ownerId, { name: 'sample-project', organisationId: orgId });
      expect(await projectService.canUserAccessProject(nonMemberId, project.id)).toBe(false);
    });

    it('returns false for nonexistent project', async () => {
      expect(await projectService.canUserAccessProject(ownerId, 'missing')).toBe(false);
    });
  });

  describe('searchProjects', () => {
    it('finds projects by name', async () => {
      await projectService.createProject(ownerId, { name: 'alpha-api', organisationId: orgId });
      await projectService.createProject(ownerId, { name: 'beta-web', organisationId: orgId });

      const results = await projectService.searchProjects('alpha');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('alpha-api');
    });
  });
});
