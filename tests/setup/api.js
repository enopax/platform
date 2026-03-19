/**
 * Jest setup for API tests
 */

// Mock NextAuth.js auth function
jest.mock('@/lib/auth', () => ({
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Global setup for API tests
beforeEach(() => {
  jest.clearAllMocks();
  process.env.NODE_ENV = 'test';
});

afterEach(() => {
  jest.clearAllTimers();
});

// Mock console methods to reduce noise
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

// Mock FormData for API tests
global.FormData = class FormData {
  constructor() {
    this.data = new Map();
  }
  append(key, value) { this.data.set(key, value); }
  get(key) { return this.data.get(key); }
  has(key) { return this.data.has(key); }
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
