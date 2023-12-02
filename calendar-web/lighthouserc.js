// https://app.skiff.city/file/28cd3dc8-0828-4e86-875f-33bee330cb1d
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:1212/calendar/'],
      numberOfRuns: 5,
      puppeteerScript: 'puppeteer-scripts/puppeteer-login.ts'
    },
    // https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md#assertions
    assert: {
      // https://github.com/GoogleChrome/lighthouse/blob/main/core/config/default-config.js#L464-L470
      assertions: {
        'first-contentful-paint': ['error', { maxNumericValue: 1 * 1000 }],
        // TTI
        interactive: ['error', { maxNumericValue: 20 * 1000 }],
        'speed-index': ['error', { maxNumericValue: 13 * 1000 }],
        'total-blocking-time': ['error', { maxNumericValue: 5800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 18 * 1000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.005 }]
      }
    },
    upload: {
      target: 'temporary-public-storage'
    }
  }
};
