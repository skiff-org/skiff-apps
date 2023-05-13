// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4 } = require('uuid');
const { InjectManifest } = require('workbox-webpack-plugin');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.OPEN_ANALYZE === 'true'
});
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin


/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: true
  },
  redirects: async function () {
    return [
      {
        source: '/',
        destination: '/mail',
        basePath: false,
        permanent: true
      }
    ];
  },
  rewrites: async () => {
    return [
      {
        source: '/status',
        destination: 'http://localhost:8080/mail/api/status/',
        basePath: false
      }
    ];
  },
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Referrer-Policy',
            value: 'strict-origin'
          }
        ]
      },
      {
        source: '/.well-known/apple-app-site-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/mail'
          }
        ]
      }
    ];
  },
  basePath: '/mail',
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    styledComponents: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  env: {
    // env vars for setupDatadog()
    DD_RUM_ENABLED: process.env.DD_RUM_ENABLED,
    DD_FORWARD_ERROR_MESSAGES: process.env.DD_FORWARD_ERROR_MESSAGES,
    DD_RUM_SAMPLE_RATE: process.env.DD_RUM_SAMPLE_RATE,
    DD_RUM_PREMIUM_SAMPLE_RATE: process.env.DD_RUM_PREMIUM_SAMPLE_RATE,
    DD_RUM_SERVICE_NAME: process.env.DD_RUM_SERVICE_NAME,
    DD_RUM_ENV: process.env.DD_RUM_ENV,
    DD_RUM_SITE: process.env.DD_RUM_SITE,
    DD_RUM_APP_ID: process.env.DD_RUM_APP_ID,
    DD_RUM_CLIENT_TOKEN: process.env.DD_RUM_CLIENT_TOKEN
  },
  webpack(config, { isServer }) {
    config.module.noParse = /\.wasm$/;
    config.module.rules.push({
      test: /\.svg$/i,
      // issuer section restricts svg as component only to
      // svgs imported from js / ts files.
      //
      // This allows configuring other behavior for
      // svgs imported from other file types (such as .css)
      issuer: { and: [/\.(js|ts|md)x?$/] },
      use: [
        {
          loader: '@svgr/webpack'
        }
      ]
    });
    config.module.rules.push({
      test: /\.wasm$/,
      use: ['base64-loader'],
      type: 'javascript/auto'
    });
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false
    };
    if (process.env.NODE_ENV === "production") {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            editor: {
              test: /prosemirror|tiptap/
            },
            calendar: {
              test: /tzdb|date-picker/
            }
          }
        }
      };
    }

    if (!isServer) {
      // either don't resolve modules or use browser-compatible versions of them
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: require.resolve('crypto-browserify'),
        fs: false,
        path: false,
        stream: require.resolve('stream-browserify')
      };
    }
    // Service worker
    if (!config.plugins) config.plugins = [];
    if (process.env.NODE_ENV === 'development') return config;
    config.plugins.push(
      new InjectManifest({
        modifyURLPrefix: {
          'static/': '_next/static/',
          'public/': '_next/public/',
          '/mail/_next/static/chunks/pages/[systemLabel]': '/mail/_next/static/chunks/pages/%5BsystemLabel%5D', // Replace with url encoded url
          '/mail/_next/static/chunks/pages/oauth/[provider]/[action]':
            '/mail/_next/static/chunks/pages/oauth/%5Bprovider%5D/%5Baction%5D'
        },
        exclude: [
          /^build-manifest\.json$/i,
          /^react-loadable-manifest\.json$/i,
          /\/_error\.js$/i,
          /\.js\.map$/i,
          /[^\n]+/ // Part of emergency sw
        ],
        maximumFileSizeToCacheInBytes: 999999999,
        swSrc: './cache-worker/emergencysw.ts', // Falling back to emergency sw since its now redundant
        swDest: '../public/sw.js'
        // additionalManifestEntries: [{ url: '/mail', revision: v4() }] Part of emergency sw
      })
    );
    // Generate Bundle Stats for CI
    config.plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'disabled',
        generateStatsFile: true
      })
    );
    return config;
  }
};

module.exports = withBundleAnalyzer(nextConfig);
