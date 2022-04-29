// eslint-disable-next-line @typescript-eslint/no-var-requires
const withNx = require('@nrwl/next/plugins/with-nx');
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/**
 * @type {import('@nrwl/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  redirects: async function() {
    return [
      {
        source: '/',
        destination: '/mail',
        basePath: false,
        permanent: true,

      }
    ]
  },
  rewrites: async () => {
    return [
      {
        source: '/status',
        destination: 'http://localhost:8080/mail/api/status/',
        basePath: false
      }
    ]
  },
  basePath: '/mail',
  reactStrictMode: true,
  swcMinify: false,
  compiler: {
    styledComponents: true
  },
  experimental: {
    externalDir: true
  },
  nx: {
    // Set this to true if you would like to to use SVGR
    // See: https://github.com/gregberge/svgr
    svgr: false
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
    return config;
  }
};

module.exports = withNx(withBundleAnalyzer(nextConfig));
