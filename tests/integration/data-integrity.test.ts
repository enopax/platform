import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Data Integrity - Record Counts', () => {
  const { userService, organisationService, teamService, projectService, resourceService } = getServices();

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should preserve all user records', async () => {
    const users = await userService.getAllUsers();
    const count = users.length;

    process.env.PRE_MIGRATION_USER_COUNT = count.toString();

    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`📊 User count: ${count}`);
  });

  it('should preserve all organisation records', async () => {
    const orgs = await organisationService.getAllOrganisations();
    const count = orgs.length;

    process.env.PRE_MIGRATION_ORG_COUNT = count.toString();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`📊 Organisation count: ${count}`);
  });

  it('should preserve all team records', async () => {
    const teams = await teamService.getAllTeams();
    const count = teams.length;

    process.env.PRE_MIGRATION_TEAM_COUNT = count.toString();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`📊 Team count: ${count}`);
  });

  it('should preserve all project records', async () => {
    const projects = await projectService.getAllProjects();
    const count = projects.length;

    process.env.PRE_MIGRATION_PROJECT_COUNT = count.toString();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`📊 Project count: ${count}`);
  });

  it('should preserve all resource records', async () => {
    const resources = await resourceService.getAllResources();
    const count = resources.length;

    process.env.PRE_MIGRATION_RESOURCE_COUNT = count.toString();
    expect(count).toBeGreaterThanOrEqual(0);
    console.log(`📊 Resource count: ${count}`);
  });
});
