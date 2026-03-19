/**
 * Setup for service tests
 */

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock console to reduce noise in tests
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();
