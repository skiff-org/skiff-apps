/**
 * Build config for development electron renderer process that uses
 * Hot-Module-Replacement
 *
 * https://webpack.js.org/concepts/hot-module-replacement/
 */

import path from 'path';

import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { TypedCssModulesPlugin } from 'typed-css-modules-webpack-plugin';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

import CheckNodeEnv from '../internals/scripts/CheckNodeEnv';

import baseConfig from './webpack.config.base';

// When an ESLint server is running, we can't set the NODE_ENV so we'll check if it's
// at the dev webpack config is not accidentally run in a production environment
if (process.env.NODE_ENV === 'production') {
  CheckNodeEnv('development');
}

const port = process.env.PORT || 4100;

export default merge(baseConfig, {
  devtool: 'eval-cheap-module-source-map',

  mode: 'development',

  target: 'web',

  entry: [...(process.env.WDYR ? [require.resolve('../internals/wdyr.ts')] : []), require.resolve('../src/index.tsx')],

  output: {
    path: path.join(__dirname, '..', 'dist'),
    publicPath: '/calendar',
    filename: '[name].dev.js',
    libraryTarget: 'umd'
  },
  optimization: {
    minimize: false
  },
  plugins: [
    // React HMR solution
    new ReactRefreshWebpackPlugin(),

    new TypedCssModulesPlugin({
      globPattern: 'src/**/*.{css,scss,sass}'
    }),

    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
      GIT_HASH: '<unknown>',
      DD_RUM_APP_ID: '',
      DD_RUM_CLIENT_TOKEN: '',
      DD_RUM_SITE: '',
      DD_RUM_SERVICE_NAME: '',
      DD_RUM_SAMPLE_RATE: '100',
      DD_FORWARD_ERROR_MESSAGES: '',
      CALENDAR_API_BASE_URL: null,
      API_WS_BASE_URL: null,
      SKEMAIL_BASE_URL: null,
      LD_CLIENT_SIDE_ID: null,
      HCAPTCHA_SITE_KEY: null,
      PASSIVE_HCAPTCHA_SITE_KEY: null,
      SKIP_RELAY_PROXY: true
    })
  ],

  node: {
    __dirname: false,
    __filename: false
  },

  // THIS IS ONLY USED FOR LOCAL DEVELOPMENT
  devServer: {
    ...(process.env.OPEN_SERVER
      ? {
          // if OPEN_SERVER env variable is set, the webpack dev server will listen for any request (and not only localhost)
          host: '0.0.0.0',
          allowedHosts: ['all']
        }
      : {
          // TODO: When we get local certs for dev services, then we can use app.skiff.local
          // Crypto.subtle, a browser JS API, requires localhost OR https:// connections
          allowedHosts: ['localhost', 'app.skiff.local']
        }),
    port,
    compress: true,
    hot: true,
    historyApiFallback: {
      index: '/calendar'
    }
  },

  cache: {
    type: 'filesystem',
    buildDependencies: {
      // This makes all dependencies of this file - build dependencies, when changed the cache will be invalidated
      config: [__filename]
    }
  }
});
