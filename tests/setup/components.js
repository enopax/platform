// Setup for component tests
require('@testing-library/jest-dom')

// Global test utilities for components
global.createMockFile = (name = 'test.txt', type = 'text/plain', size = 1024) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: jest.fn(() => true),
  writable: true
})