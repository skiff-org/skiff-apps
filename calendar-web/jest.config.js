process.env.TZ = 'UTC';
module.exports = {
  testEnvironment: '<rootDir>/tests/testUtils/setupEnv.js',
  moduleNameMapper: {
    '^uuid$': require.resolve('uuid'), // source: https://github.com/uuidjs/uuid/pull/616#issuecomment-1111012599
    '^dexie$': require.resolve('dexie'), // source: https://github.com/uuidjs/uuid/pull/616#issuecomment-1111012599
    '^lodash-es(.*)': 'lodash$1'
  },
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
    '^.+\\.mjs$': '@swc/jest'
  },
  testTimeout: 20000,
  moduleDirectories: ['node_modules', 'src'],
  setupFilesAfterEnv: ['./setupTests.ts'],
  transformIgnorePatterns: ['!node_modules/']
};
