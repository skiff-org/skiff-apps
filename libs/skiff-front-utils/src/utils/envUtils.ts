export const getEnvironment = (urlOrigin: URL) => {
  // hostname does not check port
  if (urlOrigin.hostname === 'localhost') {
    return 'local';
  }

  if (urlOrigin.origin === 'https://app.skiff.town') {
    return 'development';
  }
  if (urlOrigin.origin === 'https://app.skiff.city') {
    return 'staging';
  }
  if (urlOrigin.origin === 'https://app.skiff.com') {
    return 'production';
  }
  if (urlOrigin.origin.endsWith('vercel.app')) {
    return 'vercel';
  }

  return 'review_app';
};
