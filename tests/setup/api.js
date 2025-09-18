/**
 * Jest setup for API tests
 */

// Mock NextAuth.js auth function
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock Prisma Client globally for API tests
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organisation: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      organisationMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      team: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      teamMember: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      project: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userFile: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
      $disconnect: jest.fn(),
    })),
    // Prisma enums
    UserRole: {
      GUEST: 'GUEST',
      CUSTOMER: 'CUSTOMER',
      ADMIN: 'ADMIN',
    },
    OrganisationRole: {
      MEMBER: 'MEMBER',
      MANAGER: 'MANAGER',
      OWNER: 'OWNER',
    },
    TeamRole: {
      MEMBER: 'MEMBER',
      LEAD: 'LEAD',
    },
    StorageTier: {
      FREE_500MB: 'FREE_500MB',
      BASIC_5GB: 'BASIC_5GB',
      PRO_50GB: 'PRO_50GB',
      ENTERPRISE_500GB: 'ENTERPRISE_500GB',
      UNLIMITED: 'UNLIMITED',
    },
  };
});

// Global setup for API tests
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();

  // Reset any global state
  process.env.NODE_ENV = 'test';
});

// Global teardown
afterEach(() => {
  // Clean up any global state after each test
  jest.clearAllTimers();
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock fetch for external API calls
global.fetch = jest.fn();

// Setup text encoder/decoder for Node.js environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock FormData for API tests that handle file uploads
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }

  append(key, value) {
    this.data.set(key, value);
  }

  get(key) {
    return this.data.get(key);
  }

  has(key) {
    return this.data.has(key);
  }
};

// Mock File for file upload tests
global.File = class File {
  constructor(bits, name, options = {}) {
    this.bits = bits;
    this.name = name;
    this.type = options.type || '';
    this.size = bits.reduce((acc, bit) => acc + (typeof bit === 'string' ? bit.length : bit.byteLength), 0);
    this.lastModified = options.lastModified || Date.now();
  }
};