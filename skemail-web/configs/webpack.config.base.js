/**
 * Base webpack config used across other specific configs
 */

import path from 'path';

import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';

const isDevelopment = process.env.NODE_ENV !== 'production';

export default {
  module: {
    noParse: /\.wasm$/,
    rules: [
      //  ######   ######  ########  #### ########  ########  ######
      // ##    ## ##    ## ##     ##  ##  ##     ##    ##    ##    ##
      // ##       ##       ##     ##  ##  ##     ##    ##    ##
      //  ######  ##       ########   ##  ########     ##     ######
      //       ## ##       ##   ##    ##  ##           ##          ##
      // ##    ## ##    ## ##    ##   ##  ##           ##    ##    ##
      //  ######   ######  ##     ## #### ##           ##     ######
      {
        test: /\.tsx?$/,
        exclude: [path.join(__dirname, '.yarn/cache'), path.join(__dirname, '.yarn/unplugged'), /node_modules/],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            plugins: isDevelopment ? [require.resolve('react-refresh/babel')] : []
          }
        }
      },
      {
        test: /\.wasm$/,
        use: ['base64-loader'],
        type: 'javascript/auto'
      },
      //  ######  ######## ##    ## ##       ########
      // ##    ##    ##     ##  ##  ##       ##
      // ##          ##      ####   ##       ##
      //  ######     ##       ##    ##       ######
      //       ##    ##       ##    ##       ##
      // ##    ##    ##       ##    ##       ##
      //  ######     ##       ##    ######## ########
      // Extract all .global.css to style.css as is
      {
        // [react-image-crop] library requires importing ReactCrop.css as a dependency
        test: [/\.global\.css$/, /skiff-prosemirror\/.*\.css$/, /ReactCrop\.css$/i],
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /^((?!\.global).)*\.css$/,
        exclude: [/skiff-prosemirror/, /dist/],
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          }
        ]
      },
      // Add SASS support  - compile all other .scss files and pipe it to style.css
      {
        test: /^((?!\.global).)*\.(scss|sass)$/,
        exclude: [/dist/, /nightwatch-ui/],
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: '[name]__[local]__[hash:base64:5]'
              },
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      // Add SASS support  - compile all .global.scss files and pipe it to style.css
      {
        test: /\.global\.(scss|sass)$/,
        exclude: [/dist/, /nightwatch-ui/],
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              importLoaders: 1
            }
          },
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true
            }
          }
        ]
      },
      // based on nightwatch-ui/rollup.config.js
      {
        test: /\.s[ac]ss$/i,
        include: [/nightwatch-ui/],
        use: [
          // Creates `style` nodes from JS strings
          'style-loader',
          // Translates CSS into CommonJS
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['autoprefixer', 'postcss-discard-comments', 'cssnano']
              }
            }
          },
          // Compiles Sass to CSS
          'sass-loader'
        ]
      },
      {
        test: /\.css$/i,
        include: /nightwatch-ui/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [['autoprefixer']]
              }
            }
          }
        ]
      },
      //    ###     ######   ######  ######## ########  ######
      //   ## ##   ##    ## ##    ## ##          ##    ##    ##
      //  ##   ##  ##       ##       ##          ##    ##
      // ##     ##  ######   ######  ######      ##     ######
      // #########       ##       ## ##          ##          ##
      // ##     ## ##    ## ##    ## ##          ##    ##    ##
      // ##     ##  ######   ######  ########    ##     ######
      // SVG Icons
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        exclude: [/nightwatch-ui/],
        use: {
          loader: '@svgr/webpack'
        }
      },
      // Common Image Formats
      {
        test: /\.(?:ico|gif|png|jpg|jpeg|ttf|webp)$/,
        exclude: [/dist/],
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: 'images/[contenthash]-[name].[ext]'
            }
          }
        ]
      },
      // apple apple site association for universal links
      {
        test: /apple-app-site-association/,
        exclude: [/dist/],
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: '.well-known/',
              name: '[name]'
            }
          }
        ]
      },
      // robots.txt
      {
        test: /\.txt/,
        type: 'asset/resource',
        generator: {
          filename: 'robots.txt'
        }
      }
    ]
  },

  optimization: {
    moduleIds: 'named'
  },

  output: {
    path: path.join(__dirname, '..', 'app'),
    // https://github.com/webpack/webpack/issues/1114
    libraryTarget: 'commonjs2',

    // Subresource Integrity
    crossOriginLoading: 'anonymous'
  },
  /**
   * Determine the array of extensions that should be used to resolve modules.
   */
  resolve: {
    alias: {
      handlebars: 'handlebars/dist/handlebars.js',
      '@mui/material/Box': require.resolve('@mui/material/Box') // Make sure we use the same Box - fix crash when opening workspaces drawer. TODO: Remove it after we have the same MUI versions for all deps
    },
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    fallback: {
      // When adding libraries here, ensure you also add to jest.config.js
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      path: require.resolve('path-browserify'),
      fs: false,
      punycode: false,
      url: false,
      assert: false,
      util: false,
      Buffer: require.resolve('buffer'),
      process: false
    }
  },
  plugins: [
    new webpack.EnvironmentPlugin({
      DD_RUM_ENABLED: '',
      DD_RUM_APP_ID: '',
      DD_RUM_CLIENT_TOKEN: '',
      DD_RUM_SITE: '',
      DD_RUM_SERVICE_NAME: '',
      DD_RUM_SAMPLE_RATE: '100',
      DISABLE_DOC_RANDOM_ICON: false,
      GIT_HASH: '<unknown>',
      DD_FORWARD_ERROR_MESSAGES: '',
      SKEMAIL_BASE_URL: null,
      HCAPTCHA_SITE_KEY: null,
      PASSIVE_HCAPTCHA_SITE_KEY: null,
      LD_CLIENT_SIDE_ID: null
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'index.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'inbox.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'archive.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'drafts.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'imports.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'label.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'schedule_send.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'search.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'quick_aliases.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'sent.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'signup.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'spam.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'trash.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'oauth/google/import.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'oauth/google/auto-forward.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'oauth/outlook/import.html'
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, '..', 'app.web.html'),
      filename: 'oauth/outlook/auto-forward.html'
    }),
    /**
     * Automatically creates 44 favicon variations from png, and injects HTML
     * https://github.com/jantimon/favicons-webpack-plugin
     *
     * Add devMode: 'webapp' to test with all generated HTML and FavIcons
     */
    new FaviconsWebpackPlugin({
      logo: './icons/skemail-favicon.png'
    }),

    // Subresource Integrity
    // new SubresourceIntegrityPlugin(),

    new webpack.DefinePlugin({
      'process.env': '{}'
    })
  ]
};
