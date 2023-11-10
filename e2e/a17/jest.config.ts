export default {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/src/setup-jest.ts'],
  testEnvironmentOptions: {
    url: 'http://localhost',
  },
  testPathIgnorePatterns: ['<rootDir>/src/test.ts'],
  transform: {
    '^.+\\.(ts|mjs|js|html)$': ['jest-preset-angular', { tsconfig: './tsconfig.json' }],
  },
};
