import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { User } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('CRUD - User Operations', () => {
  const { userService } = getServices();

  let createdUser: User;

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    await teardownIntegrationTests();
  });

  it('should create user', async () => {
    createdUser = await userService.createUser({
      email: `test-${Date.now()}@example.com`,
      name: 'Test User',
      role: 'CUSTOMER',
      password: 'test-password-123',
    });

    expect(createdUser.id).toBeDefined();
    expect(createdUser.email).toContain('test-');
    expect(createdUser.role).toBe('CUSTOMER');
    console.log(`✅ Created user: ${createdUser.email} (${createdUser.id})`);
  });

  it('should read user by ID', async () => {
    const user = await userService.getUserById(createdUser.id);

    expect(user).toBeDefined();
    expect(user?.id).toBe(createdUser.id);
    expect(user?.email).toBe(createdUser.email);
    console.log(`✅ Read user by ID: ${user?.email}`);
  });

  it('should read user by email', async () => {
    const user = await userService.getUserByEmail(createdUser.email);

    expect(user).toBeDefined();
    expect(user?.id).toBe(createdUser.id);
    console.log(`✅ Read user by email: ${user?.email}`);
  });

  it('should update user', async () => {
    const updated = await userService.updateUser(createdUser.id, {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
    console.log(`✅ Updated user name to: ${updated.name}`);
  });

  it('should delete user', async () => {
    await userService.deleteUser(createdUser.id);

    const user = await userService.getUserById(createdUser.id);
    expect(user).toBeNull();
    console.log(`✅ Deleted user: ${createdUser.email}`);
  });
});
