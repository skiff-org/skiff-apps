module.exports = {
  coverageDirectory: 'coverage',
  testEnvironment: '<rootDir>/tests/testUtils/setupEnv.js',
  setupFilesAfterEnv: ['./setupTests.ts'],
  collectCoverage: true,
  coverageProvider: 'v8',
  moduleNameMapper: {
    '@skiff-org/skiff-ui': '<rootDir>/skiff-ui/src',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/tests/mocks/fileMock.js',
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$': `<rootDir>/tests/mocks/fileMock.js`,
    '^lodash-es(.*)': 'lodash$1',
    '^uuid$': require.resolve('uuid'), // source: https://github.com/uuidjs/uuid/pull/616#issuecomment-1111012599
    '^react-pdf': require.resolve('react-pdf'), // needed because we manually use ESM version but jest need cjs version
    '@simplewebauthn/browser': `<rootDir>/tests/mocks/fileMock.js`
  },
  testPathIgnorePatterns: ['./tests/mocks/', './tests/testUtils/'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  transformIgnorePatterns: ['!node_modules/'],
  testTimeout: 20000
};
