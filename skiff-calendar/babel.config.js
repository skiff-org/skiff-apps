/* eslint global-require: off, import/no-extraneous-dependencies: off */

const developmentEnvironments = ['development', 'test'];

const developmentPlugins = [];

const productionPlugins = [
  require('babel-plugin-dev-expression'),

  // babel-preset-react-optimize
  require('@babel/plugin-transform-react-constant-elements'),
  require('@babel/plugin-transform-react-inline-elements'),
  require('babel-plugin-transform-react-remove-prop-types')
];

module.exports = (api) => {
  // See docs about api at https://babeljs.io/docs/en/config-files#apicache
  api.cache.using(() => process.env.NODE_ENV);

  const development = api.env(developmentEnvironments);
  const test = api.env('test');

  return {
    presets: [
      // @babel/preset-env will automatically target our browserslist targets
      require('@babel/preset-env'),
      require('@babel/preset-typescript'),
      [require('@babel/preset-react'), { development, runtime: 'automatic' }]
    ],
    plugins: [
      // Stage 1
      // require('@babel/plugin-proposal-export-default-from'),
      // [
      //   require('@babel/plugin-proposal-pipeline-operator'),
      //   { proposal: 'minimal' }
      // ],
      // require('@babel/plugin-proposal-do-expressions'),

      // Stage 2
      [require('@babel/plugin-proposal-decorators'), { legacy: true }],
      // require('@babel/plugin-proposal-function-sent'),
      require('@babel/plugin-proposal-throw-expressions'),
      require('@babel/plugin-transform-runtime'),

      // Stage 3
      // require('@babel/plugin-syntax-dynamic-import'),
      // require('@babel/plugin-syntax-import-meta'),

      ...(development ? developmentPlugins : productionPlugins),

      ...(test
        ? [
            require('babel-plugin-replace-ts-export-assignment'),
            // needed because jest coverage doesn't support import.meta which we are using for webworkers imports
            require('babel-plugin-transform-import-meta')
          ]
        : [])
    ],
    env: {
      test: {
        //plugins: [require('@babel/plugin-transform-runtime')]
      }
    }
  };
};
