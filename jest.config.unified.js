module.exports = {
  projects: [
    // Unit tests (Node environment) - Tests in src/**/__tests__
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^nanoid$': '<rootDir>/tests/__mocks__/nanoid.ts',
        '^tinybase$': '<rootDir>/tests/__mocks__/tinybase.ts',
        '^tinybase/store$': '<rootDir>/tests/__mocks__/tinybase-store.ts',
        '^tinybase/indexes$': '<rootDir>/tests/__mocks__/tinybase-indexes.ts',
        '^tinybase/relationships$': '<rootDir>/tests/__mocks__/tinybase-relationships.ts',
        '^tinybase/mergeable-store$': '<rootDir>/tests/__mocks__/tinybase-mergeable-store.ts',
        '^tinybase/persisters$': '<rootDir>/tests/__mocks__/tinybase-persisters.ts',
      },
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.ts',
      ],
    },

    // Integration tests (Node environment) - Database integration tests
    {
      displayName: 'integration',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/integration/setup.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/integration/**/*.test.ts',
      ],
    },

    // Validation tests (Node environment)
    {
      displayName: 'validation',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/validation.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/validation/**/*.test.ts',
      ],
    },

    // Action tests (Node environment)
    {
      displayName: 'actions',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/actions.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/actions/**/*.test.ts',
      ],
    },

    // Service tests (Node environment)
    {
      displayName: 'services',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/services.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/services/**/*.test.ts',
      ],
    },

    // API tests (Node environment)
    {
      displayName: 'api',
      preset: 'ts-jest',
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/api.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/api/**/*.test.ts',
      ],
    },

    // Component tests (JSDOM environment)
    {
      displayName: 'components',
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/tests/setup/components.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      testMatch: [
        '<rootDir>/tests/components/**/*.test.tsx',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
          },
        }],
      },
    },
  ],
  collectCoverageFrom: [
    'src/lib/validation/**/*.ts',
    'src/lib/services/**/*.ts',
    'src/actions/**/*.ts',
    'src/components/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**',
  ],
}