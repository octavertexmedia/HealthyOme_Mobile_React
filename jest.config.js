module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  watchman: false,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.{ts,tsx}',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/.maestro/'],
};
