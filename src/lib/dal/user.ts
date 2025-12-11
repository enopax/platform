/**
 * User Data Access Layer
 *
 * Provides CRUD operations and custom queries for User entities.
 * Uses TinyBase indexes for efficient email and role lookups.
 */

import { BaseModel } from './base';

/**
 * User Role Enum
 * Matches Prisma UserRole enum
 */
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN'
}

/**
 * Storage Tier Enum
 * Matches Prisma StorageTier enum
 */
export enum StorageTier {
  FREE_500MB = 'FREE_500MB',
  BASIC_5GB = 'BASIC_5GB',
  PRO_50GB = 'PRO_50GB',
  ENTERPRISE_500GB = 'ENTERPRISE_500GB',
  UNLIMITED = 'UNLIMITED'
}

/**
 * User Interface
 * Matches Prisma User model
 */
export interface User {
  id: string;
  firstname?: string | null;
  lastname?: string | null;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  password: string;
  role: UserRole;
  storageTier: StorageTier;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * User Model Class
 *
 * Provides CRUD operations and custom queries for User entities.
 *
 * @example
 * ```typescript
 * const userModel = new UserModel();
 *
 * // Create user
 * const user = await userModel.create({
 *   email: 'alice@example.com',
 *   password: 'hashed-password',
 *   name: 'Alice',
 *   role: UserRole.CUSTOMER,
 *   storageTier: StorageTier.FREE_500MB
 * });
 *
 * // Find by email
 * const found = await userModel.findByEmail('alice@example.com');
 *
 * // Find by role
 * const admins = await userModel.findByRole(UserRole.ADMIN);
 * ```
 */
export class UserModel extends BaseModel<User> {
  protected tableName = 'users';

  /**
   * Find user by email address
   * Uses TinyBase index for efficient lookup
   *
   * @param email - Email address to search for
   * @returns User or null if not found
   *
   * @example
   * ```typescript
   * const user = await userModel.findByEmail('alice@example.com');
   * if (user) {
   *   console.log('Found user:', user.name);
   * }
   * ```
   */
  async findByEmail(email: string): Promise<User | null> {
    const db = await this.getStore();

    // Use TinyBase index for efficient email lookup if available
    // In tests, indexes might not be available, so fall back to findMany
    if (db.indexes) {
      const userIds = db.indexes.getSliceRowIds('usersByEmail', email);

      if (userIds.length === 0) {
        return null;
      }

      // Email is unique, so only one user should match
      return this.findById(userIds[0]);
    }

    // Fallback for tests: use findMany to search by email
    const users = await this.findMany((user) => user.email === email);
    return users[0] || null;
  }

  /**
   * Find all users with a specific role
   *
   * @param role - User role to filter by
   * @returns Array of users with the specified role
   *
   * @example
   * ```typescript
   * const admins = await userModel.findByRole(UserRole.ADMIN);
   * console.log('Admin count:', admins.length);
   * ```
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.findMany((user) => user.role === role);
  }

  /**
   * Find all users with a specific storage tier
   *
   * @param tier - Storage tier to filter by
   * @returns Array of users with the specified storage tier
   *
   * @example
   * ```typescript
   * const freeUsers = await userModel.findByStorageTier(StorageTier.FREE_500MB);
   * console.log('Free tier users:', freeUsers.length);
   * ```
   */
  async findByStorageTier(tier: StorageTier): Promise<User[]> {
    return this.findMany((user) => user.storageTier === tier);
  }

  /**
   * Find users with verified emails
   *
   * @returns Array of users with verified emails
   *
   * @example
   * ```typescript
   * const verified = await userModel.findVerified();
   * console.log('Verified users:', verified.length);
   * ```
   */
  async findVerified(): Promise<User[]> {
    return this.findMany((user) => user.emailVerified !== null && user.emailVerified !== undefined);
  }

  /**
   * Find users with unverified emails
   *
   * @returns Array of users with unverified emails
   *
   * @example
   * ```typescript
   * const unverified = await userModel.findUnverified();
   * console.log('Unverified users:', unverified.length);
   * ```
   */
  async findUnverified(): Promise<User[]> {
    return this.findMany((user) => user.emailVerified === null || user.emailVerified === undefined);
  }
}

/**
 * Singleton instance of UserModel
 * Use this instance throughout the application for user data access
 *
 * @example
 * ```typescript
 * import { userModel } from '@/lib/dal/user';
 *
 * const user = await userModel.findByEmail('alice@example.com');
 * ```
 */
export const userModel = new UserModel();
