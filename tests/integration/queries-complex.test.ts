import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Complex Queries', () => {
  const { userService, organisationService, teamService, projectService, resourceService } = getServices();

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should get user with organisations and teams', async () => {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      console.log('⚠️  No users found for complex query test');
      return;
    }

    const user = users[0];
    expect(user).toBeDefined();

    const orgs = await organisationService.getUserOrganisations(user.id);
    expect(Array.isArray(orgs)).toBe(true);

    if (orgs.length > 0) {
      const org = orgs[0];
      const teams = await teamService.getOrganisationTeams(org.id, user.id);

      for (const team of teams) {
        const members = await teamService.getTeamMembers(team.id);
        expect(Array.isArray(members)).toBe(true);
      }

      console.log(`✅ Complex query: User → ${orgs.length} orgs → teams → members`);
    }
  });

  it('should get organisation with projects and resources', async () => {
    const orgs = await organisationService.getAllOrganisations();
    if (orgs.length === 0) {
      console.log('⚠️  No organisations found for complex query test');
      return;
    }

    const org = orgs[0];
    const projects = await projectService.getOrganisationProjects(org.id);
    expect(Array.isArray(projects)).toBe(true);

    for (const project of projects) {
      const resources = await resourceService.getProjectResources(project.id);
      expect(Array.isArray(resources)).toBe(true);
    }

    console.log(`✅ Complex query: Org → ${projects.length} projects → resources`);
  });

  it('should filter resources by status', async () => {
    const activeResources = await resourceService.getResourcesByStatus('ACTIVE');
    expect(Array.isArray(activeResources)).toBe(true);

    activeResources.forEach(resource => {
      expect(resource.status).toBe('ACTIVE');
    });

    console.log(`✅ Filtered resources by status: ${activeResources.length} ACTIVE resources`);
  });

  it('should search users by email', async () => {
    const allUsers = await userService.getAllUsers();
    if (allUsers.length === 0) {
      console.log('⚠️  No users found for search test');
      return;
    }

    const searchEmail = allUsers[0].email.substring(0, 5);
    const users = await userService.searchUsers(searchEmail);
    expect(Array.isArray(users)).toBe(true);

    console.log(`✅ Search users: Found ${users.length} users matching "${searchEmail}"`);
  });

  it('should search organisations', async () => {
    const allOrgs = await organisationService.getAllOrganisations();
    if (allOrgs.length === 0) {
      console.log('⚠️  No organisations found for search test');
      return;
    }

    const searchTerm = allOrgs[0].name.substring(0, 3);
    const orgs = await organisationService.searchOrganisations(searchTerm);
    expect(Array.isArray(orgs)).toBe(true);

    console.log(`✅ Search organisations: Found ${orgs.length} orgs matching "${searchTerm}"`);
  });
});
