/* eslint-disable import/no-extraneous-dependencies, @typescript-eslint/no-unsafe-call*/

const path = require('path');

require('@babel/register')({
  extensions: ['.es6', '.es', '.jsx', '.js', '.mjs', '.ts', '.tsx'],
  cwd: path.join(__dirname, '..', '..')
});
