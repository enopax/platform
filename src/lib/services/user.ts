import { getStoreAsync } from '@/lib/store';
import type { User, UserRole } from '@/lib/store';
import type { CreateUserData, UpdateUserData, UserSearchResult } from '@/lib/store/repositories/user.repository';

export type { CreateUserData, UpdateUserData, UserSearchResult };

export class UserService {
  async createUser(data: CreateUserData): Promise<User> {
    try {
      const store = await getStoreAsync();
      return await store.users.create(data);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const store = await getStoreAsync();
      return await store.users.findById(userId);
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const store = await getStoreAsync();
      return await store.users.findByEmail(email);
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      const store = await getStoreAsync();
      return await store.users.update(userId, data);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async updateUserAdmin(userId: string, data: UpdateUserData, adminUserId: string): Promise<User> {
    try {
      const adminUser = await this.getUserById(adminUserId);
      if (adminUser?.role !== 'SUPERADMIN') {
        throw new Error('Insufficient permissions to update user');
      }
      return await this.updateUser(userId, data);
    } catch (error) {
      console.error('Failed to update user as admin:', error);
      throw error;
    }
  }

  async setUserAvatar(userId: string, images: string[]): Promise<User> {
    try {
      const imageUrl = images.length > 0 ? images[0] : null;
      const store = await getStoreAsync();
      return await store.users.update(userId, { image: imageUrl });
    } catch (error) {
      console.error('Failed to set user avatar:', error);
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    try {
      const store = await getStoreAsync();
      return await store.users.search(query, limit);
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  async deactivateUser(userId: string): Promise<User> {
    try {
      const store = await getStoreAsync();
      return await store.users.update(userId, { role: 'GUEST' });
    } catch (error) {
      console.error('Failed to deactivate user:', error);
      throw error;
    }
  }

  async validateUserExists(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return !!user;
    } catch (error) {
      console.error('Failed to validate user existence:', error);
      return false;
    }
  }

  async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      return user?.role === 'SUPERADMIN';
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }
}

export const userService = new UserService();
