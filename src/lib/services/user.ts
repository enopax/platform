import { PrismaClient, User, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateUserData {
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  image?: string;
  role?: UserRole;
  password?: string;
}

export interface UpdateUserData {
  name?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  image?: string;
  role?: UserRole;
}

export interface UserSearchResult {
  id: string;
  name?: string;
  firstname?: string;
  lastname?: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt: Date;
}

export class UserService {
  async createUser(data: CreateUserData): Promise<User> {
    try {
      return await prisma.user.create({
        data: {
          name: data.name,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          image: data.image,
          role: data.role ?? UserRole.CUSTOMER,
          password: data.password ?? '',
        },
      });
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Failed to get user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      console.error('Failed to get user by email:', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: UpdateUserData): Promise<User> {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: {
          name: data.name,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          image: data.image,
          role: data.role,
        },
      });
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  async updateUserAdmin(userId: string, data: UpdateUserData, adminUserId: string): Promise<User> {
    try {
      // Check if the admin user has admin privileges
      const adminUser = await this.getUserById(adminUserId);
      if (adminUser?.role !== UserRole.ADMIN) {
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

      return await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });
    } catch (error) {
      console.error('Failed to set user avatar:', error);
      throw error;
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResult[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              firstname: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              lastname: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              email: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          firstname: true,
          lastname: true,
          email: true,
          image: true,
          role: true,
          createdAt: true,
        },
        orderBy: [
          { name: 'asc' },
        ],
        take: limit,
      });

      return users;
    } catch (error) {
      console.error('Failed to search users:', error);
      return [];
    }
  }

  async deactivateUser(userId: string): Promise<User> {
    try {
      // Since there's no isActive field, we could use role or implement a soft delete differently
      // For now, let's change role to GUEST to indicate inactive status
      return await prisma.user.update({
        where: { id: userId },
        data: { role: UserRole.GUEST },
      });
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
      return user?.role === UserRole.ADMIN;
    } catch (error) {
      console.error('Failed to check admin status:', error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Failed to get all users:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      console.error('Failed to delete user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();