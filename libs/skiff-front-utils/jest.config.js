module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest'
  },
  modulePathIgnorePatterns: ['<rootDir>/dist'],
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/mocks/fileMock.js',
    ReactPdf: '<rootDir>/mocks/fileMock.js',
    '@skiff-org/skiff-ui': '<rootDir>/skiff-ui/src',
    '^lodash-es(.*)': 'lodash$1',
    '^uuid$': require.resolve('uuid'), // source: https://github.com/uuidjs/uuid/pull/616#issuecomment-1111012599
    '^react-pdf': require.resolve('react-pdf') // needed because we manually use ESM version but jest need cjs version
  },
  testPathIgnorePatterns: ['.d.ts', '.js'],
  transformIgnorePatterns: ['node_modules/(?!^@simplewebauthn/browser)/'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts']
};
