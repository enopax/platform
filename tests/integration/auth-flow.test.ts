import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { User } from '@prisma/client';
import { setupIntegrationTests, teardownIntegrationTests, getServices } from './setup';

describe('Authentication Flow', () => {
  const { userService } = getServices();

  let testUser: User;

  beforeAll(async () => {
    await setupIntegrationTests();
  });

  afterAll(async () => {
    if (testUser) {
      await userService.deleteUser(testUser.id);
    }
    await teardownIntegrationTests();
  });

  it('should create user via auth adapter', async () => {
    testUser = await userService.createUser({
      email: `auth-test-${Date.now()}@example.com`,
      name: 'Auth Test User',
      role: 'CUSTOMER',
      password: 'test-password-123',
    });

    expect(testUser.id).toBeDefined();
    expect(testUser.email).toContain('auth-test-');
    console.log(`✅ Created user via auth: ${testUser.email} (${testUser.id})`);
  });

  it('should find user by email (used by auth)', async () => {
    const user = await userService.getUserByEmail(testUser.email);
    expect(user).toBeDefined();
    expect(user?.id).toBe(testUser.id);
    console.log(`✅ Found user by email: ${user?.email}`);
  });

  it('should update user email verified status', async () => {
    const updated = await userService.updateUser(testUser.id, {
      emailVerified: new Date(),
    } as any);

    expect(updated.emailVerified).toBeDefined();
    console.log(`✅ Updated email verified status for: ${testUser.email}`);
  });

  it('should verify user exists', async () => {
    const exists = await userService.validateUserExists(testUser.id);
    expect(exists).toBe(true);
    console.log(`✅ Verified user exists: ${testUser.email}`);
  });

  it('should check user admin status', async () => {
    const isAdmin = await userService.isUserAdmin(testUser.id);
    expect(typeof isAdmin).toBe('boolean');
    console.log(`✅ Checked admin status for user: ${testUser.email} - ${isAdmin ? 'Admin' : 'Not Admin'}`);
  });
});
