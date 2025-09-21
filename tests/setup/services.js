/**
 * Setup for service tests
 */

// Mock Prisma client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    userFile: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    teamFile: {
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    team: {
      findUnique: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
    },
    storageQuota: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    ipfsMetric: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

// Mock fetch for IPFS API calls
global.fetch = jest.fn();

// Mock console to reduce noise in tests
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();