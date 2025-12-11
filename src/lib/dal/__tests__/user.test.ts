/**
 * User Model Tests
 *
 * Tests for User data access layer including CRUD operations
 * and custom query methods.
 */

import { UserModel, UserRole, StorageTier, type User } from '../user';
import { resetDB } from '@/lib/tinybase/db';

describe('UserModel', () => {
  // Create a new instance for each test suite to avoid state pollution
  let testUserModel: UserModel;

  beforeEach(async () => {
    // Reset database before each test
    await resetDB();
    // Create fresh model instance
    testUserModel = new UserModel();
  });

  describe('create', () => {
    it('should create a user with all required fields', async () => {
      const userData = {
        email: 'alice@example.com',
        password: 'hashed-password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      };

      const user = await testUserModel.create(userData);

      expect(user.id).toBe('test-id-000001');
      expect(user.email).toBe('alice@example.com');
      expect(user.name).toBe('Alice');
      expect(user.role).toBe(UserRole.CUSTOMER);
      expect(user.storageTier).toBe(StorageTier.FREE_500MB);
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with optional fields', async () => {
      const userData = {
        email: 'bob@example.com',
        password: 'hashed-password',
        firstname: 'Bob',
        lastname: 'Smith',
        name: 'Bob Smith',
        image: 'https://example.com/bob.jpg',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.BASIC_5GB,
        emailVerified: new Date('2025-01-01')
      };

      const user = await testUserModel.create(userData);

      expect(user.firstname).toBe('Bob');
      expect(user.lastname).toBe('Smith');
      expect(user.image).toBe('https://example.com/bob.jpg');
      expect(user.emailVerified).toBeInstanceOf(Date);
    });

    it('should create admin users', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'hashed-password',
        name: 'Admin User',
        role: UserRole.ADMIN,
        storageTier: StorageTier.UNLIMITED
      };

      const user = await testUserModel.create(userData);

      expect(user.role).toBe(UserRole.ADMIN);
      expect(user.storageTier).toBe(StorageTier.UNLIMITED);
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const created = await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const found = await testUserModel.findById(created.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(created.id);
      expect(found?.email).toBe('alice@example.com');
    });

    it('should return null for non-existent ID', async () => {
      const found = await testUserModel.findById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email using TinyBase index', async () => {
      await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const found = await testUserModel.findByEmail('alice@example.com');

      expect(found).not.toBeNull();
      expect(found?.email).toBe('alice@example.com');
      expect(found?.name).toBe('Alice');
    });

    it('should return null for non-existent email', async () => {
      const found = await testUserModel.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });

    it('should handle case-sensitive email search', async () => {
      await testUserModel.create({
        email: 'Alice@Example.com',
        password: 'hashed-password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      // Email search is case-sensitive
      const found = await testUserModel.findByEmail('Alice@Example.com');
      expect(found).not.toBeNull();

      const notFound = await testUserModel.findByEmail('alice@example.com');
      expect(notFound).toBeNull();
    });
  });

  describe('findByRole', () => {
    beforeEach(async () => {
      // Create users with different roles
      await testUserModel.create({
        email: 'customer1@example.com',
        password: 'password',
        name: 'Customer 1',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'customer2@example.com',
        password: 'password',
        name: 'Customer 2',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'admin@example.com',
        password: 'password',
        name: 'Admin',
        role: UserRole.ADMIN,
        storageTier: StorageTier.UNLIMITED
      });

      await testUserModel.create({
        email: 'guest@example.com',
        password: 'password',
        name: 'Guest',
        role: UserRole.GUEST,
        storageTier: StorageTier.FREE_500MB
      });
    });

    it('should find all customers', async () => {
      const customers = await testUserModel.findByRole(UserRole.CUSTOMER);

      expect(customers).toHaveLength(2);
      expect(customers.every(u => u.role === UserRole.CUSTOMER)).toBe(true);
    });

    it('should find all admins', async () => {
      const admins = await testUserModel.findByRole(UserRole.ADMIN);

      expect(admins).toHaveLength(1);
      expect(admins[0].email).toBe('admin@example.com');
    });

    it('should find all guests', async () => {
      const guests = await testUserModel.findByRole(UserRole.GUEST);

      expect(guests).toHaveLength(1);
      expect(guests[0].email).toBe('guest@example.com');
    });

    it('should return empty array when no users match role', async () => {
      // Delete all customers
      const customers = await testUserModel.findByRole(UserRole.CUSTOMER);
      for (const customer of customers) {
        await testUserModel.delete(customer.id);
      }

      const result = await testUserModel.findByRole(UserRole.CUSTOMER);
      expect(result).toHaveLength(0);
    });
  });

  describe('findByStorageTier', () => {
    beforeEach(async () => {
      await testUserModel.create({
        email: 'free1@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'free2@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'pro@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.PRO_50GB
      });
    });

    it('should find users by storage tier', async () => {
      const freeUsers = await testUserModel.findByStorageTier(StorageTier.FREE_500MB);
      expect(freeUsers).toHaveLength(2);

      const proUsers = await testUserModel.findByStorageTier(StorageTier.PRO_50GB);
      expect(proUsers).toHaveLength(1);
    });
  });

  describe('findVerified and findUnverified', () => {
    beforeEach(async () => {
      await testUserModel.create({
        email: 'verified1@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB,
        emailVerified: new Date('2025-01-01')
      });

      await testUserModel.create({
        email: 'verified2@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB,
        emailVerified: new Date('2025-01-02')
      });

      await testUserModel.create({
        email: 'unverified1@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'unverified2@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB,
        emailVerified: null
      });
    });

    it('should find verified users', async () => {
      const verified = await testUserModel.findVerified();

      expect(verified).toHaveLength(2);
      expect(verified.every(u => u.emailVerified instanceof Date)).toBe(true);
    });

    it('should find unverified users', async () => {
      const unverified = await testUserModel.findUnverified();

      expect(unverified).toHaveLength(2);
      expect(unverified.every(u => u.emailVerified === null || u.emailVerified === undefined)).toBe(true);
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const updated = await testUserModel.update(user.id, {
        name: 'Alice Updated',
        storageTier: StorageTier.PRO_50GB
      });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe('Alice Updated');
      expect(updated?.storageTier).toBe(StorageTier.PRO_50GB);
      expect(updated?.email).toBe('alice@example.com'); // Unchanged
    });

    it('should update emailVerified', async () => {
      const user = await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const verifiedDate = new Date('2025-01-01');
      const updated = await testUserModel.update(user.id, {
        emailVerified: verifiedDate
      });

      expect(updated?.emailVerified).toBeInstanceOf(Date);
      expect(updated?.emailVerified?.toISOString()).toBe(verifiedDate.toISOString());
    });

    it('should update updatedAt timestamp', async () => {
      const user = await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const originalUpdatedAt = user.updatedAt;

      // Wait a bit to ensure timestamp changes
      await new Promise(resolve => setTimeout(resolve, 10));

      const updated = await testUserModel.update(user.id, {
        name: 'Alice Updated'
      });

      expect(updated?.updatedAt).not.toEqual(originalUpdatedAt);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await testUserModel.create({
        email: 'alice@example.com',
        password: 'hashed-password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      const deleted = await testUserModel.delete(user.id);
      expect(deleted).toBe(true);

      const found = await testUserModel.findById(user.id);
      expect(found).toBeNull();
    });

    it('should return false when deleting non-existent user', async () => {
      const deleted = await testUserModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('count and exists', () => {
    it('should count users', async () => {
      expect(await testUserModel.count()).toBe(0);

      await testUserModel.create({
        email: 'user1@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      expect(await testUserModel.count()).toBe(1);

      await testUserModel.create({
        email: 'user2@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      expect(await testUserModel.count()).toBe(2);
    });

    it('should check if user exists', async () => {
      const user = await testUserModel.create({
        email: 'alice@example.com',
        password: 'password',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      expect(await testUserModel.exists(user.id)).toBe(true);
      expect(await testUserModel.exists('non-existent-id')).toBe(false);
    });
  });

  describe('findMany', () => {
    beforeEach(async () => {
      await testUserModel.create({
        email: 'alice@example.com',
        password: 'password',
        name: 'Alice',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.FREE_500MB
      });

      await testUserModel.create({
        email: 'bob@example.com',
        password: 'password',
        name: 'Bob',
        role: UserRole.ADMIN,
        storageTier: StorageTier.UNLIMITED
      });

      await testUserModel.create({
        email: 'charlie@example.com',
        password: 'password',
        name: 'Charlie',
        role: UserRole.CUSTOMER,
        storageTier: StorageTier.PRO_50GB
      });
    });

    it('should find all users without filter', async () => {
      const users = await testUserModel.findMany();
      expect(users).toHaveLength(3);
    });

    it('should filter users by custom predicate', async () => {
      const proUsers = await testUserModel.findMany(
        (user) => user.storageTier === StorageTier.PRO_50GB || user.storageTier === StorageTier.UNLIMITED
      );

      expect(proUsers).toHaveLength(2);
      expect(proUsers.some(u => u.email === 'bob@example.com')).toBe(true);
      expect(proUsers.some(u => u.email === 'charlie@example.com')).toBe(true);
    });
  });
});
