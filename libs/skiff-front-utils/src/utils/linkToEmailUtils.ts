import { getEnvironment } from './envUtils';

// Get origin for email.
export const getEmailBasePath = () => {
  if (process.env.SKEMAIL_BASE_URL) {
    return process.env.SKEMAIL_BASE_URL;
  }
  const origin = window.location.origin;
  const reviewAppPhrase = 'skeditor-web-pr-';
  // local env
  // TODO (EMAIL-565): use process.env.NODE_ENV to differentiate
  // local env once it's added to the frontend
  if (getEnvironment(new URL(origin)) === 'local') {
    return 'http://localhost:4200/mail';
  }
  // review apps
  if (origin.includes(reviewAppPhrase)) {
    const prNumberStartIndex = origin.indexOf(reviewAppPhrase) + reviewAppPhrase.length;
    // This is <PR_NUMBER>.skiff.town (shared between editor and skemail origins for review apps)
    const reviewAppOriginSuffix = origin.slice(prNumberStartIndex);
    return `https://skemail-web-pr-${reviewAppOriginSuffix}/mail`;
  }

  // The editor origin for dev, staging, and production are the same as skeditor
  return `${origin}/mail`;
};
