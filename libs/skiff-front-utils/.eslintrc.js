require('eslint-config-skiff-eslint/frontend');
module.exports = {
  extends: ['skiff-eslint/frontend'],
  parserOptions: {
    project: 'tsconfig.json',
    jsx: true
  },
  rules: {
    // TODO: Ideally, we should set `import/no-cycle` to 'error' in our base
    // ESLint config.
    'import/no-cycle': 'error',
    'react/self-closing-comp': 'error',
    'react/jsx-sort-props': 'warn',
    'react/jsx-indent': ['warn', 2],
    'react/jsx-newline': ['warn', { prevent: true }],
    'react/jsx-props-no-multi-spaces': 'warn',
    'react/jsx-key': 'warn',
    '@typescript-eslint/comma-dangle': 'off'
  },
  ignorePatterns: ['.eslintrc.js', '**/*.d.ts', 'dist', 'build.js']
};
