require('eslint-config-skiff-eslint/frontend');

module.exports = {
  extends: ['skiff-eslint/frontend'],
  parserOptions: {
    project: './tsconfig.json',
    jsx: true // True for React
  },
  ignorePatterns: ['.eslintrc.js', '**/*.d.ts', 'dist', 'build.js'],
};
