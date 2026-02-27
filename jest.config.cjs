const shared = {
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  clearMocks: true,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '/node_modules/',
    'auth-landing\\.spec\\.ts$',
    'auth-cross-links\\.spec\\.ts$',
    'login-flow\\.spec\\.ts$',
    'auth-responsive-e2e\\.spec\\.ts$',
  ],
};

module.exports = {
  projects: [
    {
      ...shared,
      displayName: 'dom',
      testEnvironment: 'jsdom',
      setupFiles: ['<rootDir>/jest.polyfills.js'],
      testPathIgnorePatterns: [
        ...shared.testPathIgnorePatterns,
        'middleware\\.test\\.ts$',
        'role-guards\\.test\\.ts$',
        'integration/api',
        'integration/api/',
        'contract',
        'contract/',
        'e2e/',
      ],
    },
    {
      ...shared,
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/tests/unit/lib/auth/middleware.test.ts',
        '<rootDir>/tests/unit/lib/auth/role-guards.test.ts',
        '<rootDir>/tests/integration/api/**/*.test.ts',
        '<rootDir>/tests/contract/**/*.test.ts',
        '<rootDir>/tests/e2e/**/*.spec.ts',
      ],
    },
  ],
};