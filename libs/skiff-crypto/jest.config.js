module.exports = {
  transform: {
    '^.+\\.tsx?$': 'esbuild-jest'
  },
  testPathIgnorePatterns: ['.d.ts', '.js']
};
