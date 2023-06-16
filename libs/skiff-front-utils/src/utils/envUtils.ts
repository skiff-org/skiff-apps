export const getEnvironment = (urlOrigin: URL) => {
  // hostname does not check port
  if (urlOrigin.hostname === 'localhost') {
    return 'local';
  }

  if (urlOrigin.origin === 'https://app.skiff.town') {
    return 'development';
  }
  if (urlOrigin.origin === 'https://app.skiff.city' || urlOrigin.host === 'https://staging.skiff.org') {
    return 'staging';
  }
  if (urlOrigin.origin === 'https://app.skiff.com' || urlOrigin.origin === 'https://app.skiff.org') {
    return 'production';
  }
  if (urlOrigin.origin.endsWith('vercel.app')) {
    return 'vercel';
  }

  return 'review_app';
};
