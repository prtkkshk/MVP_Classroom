// Jest setup file for Node.js integration tests
// This file doesn't contain JSX syntax and is safe for Node.js environment

// Add fetch polyfill for Node.js environment
if (typeof globalThis.fetch === 'undefined') {
  try {
    // Try to use built-in Node.js fetch (Node 18+)
    const { default: fetch } = require('node:fetch')
    globalThis.fetch = fetch
  } catch (error) {
    try {
      // Fallback to node-fetch
      const fetch = require('node-fetch')
      globalThis.fetch = fetch
    } catch (fallbackError) {
      // If all else fails, create a mock fetch
      globalThis.fetch = jest.fn()
      console.warn('Warning: Using mock fetch - tests may not work properly')
    }
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console.log during tests
  // log: jest.fn(),
  // Uncomment to suppress console.warn during tests
  // warn: jest.fn(),
  // Uncomment to suppress console.error during tests
  // error: jest.fn(),
}

// Mock performance API
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
}
