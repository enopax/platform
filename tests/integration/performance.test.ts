import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Performance Tests', () => {
  const { userService, organisationService, teamService } = getServices();

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should find user by ID in <100ms', async () => {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      console.log('⚠️  No users found for performance test');
      return;
    }

    const user = users[0];

    const start = Date.now();
    await userService.getUserById(user.id);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    console.log(`✅ Find user by ID: ${duration}ms`);
  });

  it('should find user by email (indexed) in <100ms', async () => {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      console.log('⚠️  No users found for performance test');
      return;
    }

    const start = Date.now();
    await userService.getUserByEmail(users[0].email);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    console.log(`✅ Find user by email: ${duration}ms`);
  });

  it('should get organisation teams in <200ms', async () => {
    const orgs = await organisationService.getAllOrganisations();
    if (orgs.length === 0) {
      console.log('⚠️  No organisations found for performance test');
      return;
    }

    const org = orgs[0];
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      console.log('⚠️  No users found for performance test');
      return;
    }

    const start = Date.now();
    await teamService.getOrganisationTeams(org.id, users[0].id);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(200);
    console.log(`✅ Get organisation teams: ${duration}ms`);
  });

  it('should handle 50 sequential reads in <5s', async () => {
    const users = await userService.getAllUsers();
    if (users.length === 0) {
      console.log('⚠️  No users found for performance test');
      return;
    }

    const user = users[0];

    const start = Date.now();
    for (let i = 0; i < 50; i++) {
      await userService.getUserById(user.id);
    }
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000);
    console.log(`✅ 50 sequential reads: ${duration}ms (avg: ${(duration / 50).toFixed(2)}ms per read)`);
  });

  it('should get all users efficiently', async () => {
    const start = Date.now();
    const users = await userService.getAllUsers();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
    console.log(`✅ Get all users (${users.length} records): ${duration}ms`);
  });

  it('should get all organisations efficiently', async () => {
    const start = Date.now();
    const orgs = await organisationService.getAllOrganisations();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(500);
    console.log(`✅ Get all organisations (${orgs.length} records): ${duration}ms`);
  });
});
