/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call */

import path from 'path';

import CompressionPlugin from 'compression-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { merge } from 'webpack-merge';

import CheckNodeEnv from '../internals/scripts/CheckNodeEnv';
import DeleteSourceMaps from '../internals/scripts/DeleteSourceMaps';

import baseConfig from './webpack.config.base';

CheckNodeEnv('production');
DeleteSourceMaps();

export default merge(baseConfig, {
  stats: 'normal',
  devtool: process.env.DEBUG_PROD === 'true' ? 'source-map' : undefined,

  mode: 'production',

  target: 'web',

  entry: {
    main: [path.join(__dirname, '..', 'src/index.tsx')],
    'push-sw': require.resolve('../src/push/push-sw.js')
  },

  output: {
    path: path.join(__dirname, '..', 'src/dist'),
    publicPath: '/mail/',
    libraryTarget: 'umd',
    chunkFilename: 'skemail6-[name].[contenthash].js',
    filename: (chunkData) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (chunkData.chunk.name === 'push-sw') {
        return 'push/push-sw.js';
      }
      return 'skemail6-[name].[contenthash].js';
    }
  },

  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        editor: {
          test: /prosemirror|tiptap|katex/
        },
        calendar: {
          test: /tzdb|date-picker/
        }
      }
    },
    minimizer: process.env.E2E_BUILD
      ? ['...']
      : [new CssMinimizerPlugin({ minimizerOptions: { sourceMap: process.env.DEBUG_PROD === 'true' } }), '...']
  },

  plugins: [
    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'production',
      DEBUG_PROD: false,
      START_MINIMIZED: false,
      E2E_BUILD: false,
      APPNAME: null,
      LD_CLIENT_SIDE_ID: null,
      HCAPTCHA_SITE_KEY: null,
      PASSIVE_HCAPTCHA_SITE_KEY: null
    }),

    new BundleAnalyzerPlugin({
      analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
      openAnalyzer: process.env.OPEN_ANALYZER === 'true'
    }),

    new CompressionPlugin({ algorithm: 'gzip', exclude: [/apple-app-site-association/, /robots/, /push-sw/] }),
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      compressionOptions: {
        level: 11
      },
      exclude: [/apple-app-site-association/, /robots/]
    })
  ]
});
