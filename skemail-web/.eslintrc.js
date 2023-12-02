require('eslint-config-skiff-eslint/frontend');
const tsConfig = require('./tsconfig.json');

module.exports = {
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaFeatures: {
      jsx: true
    }
  },
  extends: ['plugin:@next/next/recommended', 'skiff-eslint/frontend'],
  rules: {
    'react/self-closing-comp': 'error',
    'react/jsx-sort-props': 'warn',
    'react/jsx-indent': ['warn', 2],
    'react/jsx-newline': ['warn', { prevent: true }],
    'react/jsx-props-no-multi-spaces': 'warn',
    'react/jsx-key': 'warn',
  },
  ignorePatterns: [
    ...tsConfig.exclude,
    'dist/**',
    '.next/**',
    '.eslintrc.js',
    'generated/**',
    'next.config.js',
    'sw.js'
  ],
};
