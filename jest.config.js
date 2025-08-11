const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/store/(.*)$': '<rootDir>/src/store/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Updated transformIgnorePatterns to handle ES modules
  transformIgnorePatterns: [
    'node_modules/(?!(framer-motion|@framer|@radix-ui|@supabase|isows|@supabase/realtime-js|@supabase/supabase-js)/)',
  ],
  // Add testTimeout for async operations
  testTimeout: 30000,
  // Add verbose output for debugging
  verbose: true,
  // Add extensionsToTreatAsEsm for ES modules
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  // Add globals for ES modules
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  // Configure different test environments based on test type
  projects: [
    {
      displayName: 'Component Tests',
      testMatch: ['<rootDir>/tests/**/*.test.tsx'],
      testEnvironment: 'jsdom',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/**/*-integration.test.ts'],
      testEnvironment: 'node',
      setupFilesAfterEnv: ['<rootDir>/jest.setup.node.js'],
    },
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 