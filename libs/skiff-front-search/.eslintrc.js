require('eslint-config-skiff-eslint/frontend');
module.exports = {
  extends: ['skiff-eslint/frontend'],
  parserOptions: {
    project: 'tsconfig.json'
  },
  ignorePatterns: ['dist/**', '.eslintrc.js', 'build.js'],
};
