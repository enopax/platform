/**
 * Simple tests for UserService to verify basic functionality
 */

import { UserService, userService } from '@/lib/services/user';

// Mock Prisma Client
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  return {
    PrismaClient: jest.fn(() => mockPrisma),
    UserRole: {
      GUEST: 'GUEST',
      CUSTOMER: 'CUSTOMER',
      ADMIN: 'ADMIN',
    },
  };
});

describe('UserService - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be instantiated', () => {
    expect(userService).toBeDefined();
    expect(userService).toBeInstanceOf(UserService);
  });

  it('should have all required methods', () => {
    const expectedMethods = [
      'createUser',
      'getUserById',
      'getUserByEmail',
      'updateUser',
      'updateUserAdmin',
      'setUserAvatar',
      'searchUsers',
      'deactivateUser',
      'validateUserExists',
      'isUserAdmin',
    ];

    expectedMethods.forEach(method => {
      expect(userService).toHaveProperty(method);
      expect(typeof userService[method as keyof UserService]).toBe('function');
    });
  });

  it('should be able to create a new UserService instance', () => {
    const newService = new UserService();
    expect(newService).toBeDefined();
    expect(newService).toBeInstanceOf(UserService);
  });
});