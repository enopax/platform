import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { User, Organisation } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Relationships - Organisation', () => {
  const { userService, organisationService, teamService, projectService } = getServices();

  let testUser: User | null;
  let testOrg: Organisation | null;

  beforeAll(async () => {
    await setupIntegrationTests();

    const users = await userService.getAllUsers();
    testUser = users[0] || null;

    if (testUser) {
      const orgs = await organisationService.getUserOrganisations(testUser.id);
      testOrg = orgs[0] || null;
    }
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should find organisation by owner', async () => {
    if (!testUser || !testOrg) {
      console.log('⚠️  No test data available');
      return;
    }

    const orgs = await organisationService.findByOwner(testUser.id);
    const foundOrg = orgs.some(o => o.id === testOrg?.id);

    expect(foundOrg).toBe(true);
    console.log(`✅ Found ${orgs.length} organisations owned by user ${testUser.email}`);
  });

  it('should get organisation teams', async () => {
    if (!testUser || !testOrg) {
      console.log('⚠️  No test data available');
      return;
    }

    const teams = await teamService.getOrganisationTeams(testOrg.id, testUser.id);
    expect(Array.isArray(teams)).toBe(true);

    teams.forEach(team => {
      expect(team.organisationId).toBe(testOrg?.id);
    });

    console.log(`✅ Found ${teams.length} teams in organisation ${testOrg.name}`);
  });

  it('should get organisation projects', async () => {
    if (!testOrg) {
      console.log('⚠️  No test data available');
      return;
    }

    const projects = await projectService.getOrganisationProjects(testOrg.id);
    expect(Array.isArray(projects)).toBe(true);

    projects.forEach(project => {
      expect(project.organisationId).toBe(testOrg?.id);
    });

    console.log(`✅ Found ${projects.length} projects in organisation ${testOrg.name}`);
  });

  it('should get organisation members', async () => {
    if (!testUser || !testOrg) {
      console.log('⚠️  No test data available');
      return;
    }

    const members = await organisationService.getOrganisationMembers(testOrg.id);
    expect(Array.isArray(members)).toBe(true);
    expect(members.length).toBeGreaterThan(0);

    const ownerIsMember = members.some(m => m.user.id === testUser?.id);
    expect(ownerIsMember).toBe(true);

    console.log(`✅ Found ${members.length} members in organisation ${testOrg.name}`);
  });
});
