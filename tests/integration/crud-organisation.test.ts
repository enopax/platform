import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { User, Organisation } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('CRUD - Organisation Operations', () => {
  const { userService, organisationService } = getServices();

  let testUser: User;
  let createdOrg: Organisation;

  beforeAll(async () => {
    await setupIntegrationTests();

    testUser = await userService.createUser({
      email: `org-test-${Date.now()}@example.com`,
      name: 'Org Test User',
      role: 'CUSTOMER',
      password: 'test-password-123',
    });
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should create organisation', async () => {
    const orgData = {
      name: `test-org-${Date.now()}`,
      description: 'Test Organisation',
    };

    const orgInfo = await organisationService.createOrganisation(testUser.id, orgData);
    createdOrg = orgInfo as Organisation;

    expect(createdOrg.id).toBeDefined();
    expect(createdOrg.ownerId).toBe(testUser.id);
    expect(createdOrg.name).toBe(orgData.name);
    console.log(`✅ Created organisation: ${createdOrg.name} (${createdOrg.id})`);
  });

  it('should read organisation by ID', async () => {
    const org = await organisationService.getOrganisationById(createdOrg.id);

    expect(org).toBeDefined();
    expect(org?.id).toBe(createdOrg.id);
    console.log(`✅ Read organisation by ID: ${org?.name}`);
  });

  it('should read organisation by name', async () => {
    const org = await organisationService.getOrganisationByName(createdOrg.name);

    expect(org).toBeDefined();
    expect(org?.id).toBe(createdOrg.id);
    console.log(`✅ Read organisation by name: ${org?.name}`);
  });

  it('should update organisation', async () => {
    const updated = await organisationService.updateOrganisation(
      createdOrg.id,
      testUser.id,
      {
        description: 'Updated Organisation Description',
      }
    );

    expect(updated.description).toBe('Updated Organisation Description');
    console.log(`✅ Updated organisation description`);
  });

  it('should delete organisation', async () => {
    await organisationService.deleteOrganisation(createdOrg.id, testUser.id);

    const org = await organisationService.getOrganisationById(createdOrg.id);
    expect(org?.isActive).toBe(false);
    console.log(`✅ Soft deleted organisation: ${createdOrg.name}`);
  });

  afterAll(async () => {
    await userService.deleteUser(testUser.id);
    await teardownIntegrationTests();
  });
});
