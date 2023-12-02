export function getBaseDomain() {
  if (process.env.ENVIRONMENT) {
    const env = process.env.ENVIRONMENT;
    if (env == 'dev' || env == 'development') {
      return 'skiff.town';
    }
    if (env == 'stage' || env == 'staging') {
      return 'skiff.city';
    }
    if (env == 'prod' || env == 'production') {
      return 'skiff.com';
    }
  }
  return 'skiff.town';
}
