// Get origin for editor.
import { DRIVE_PATH } from '../constants';
import { getEnvironment } from './envUtils';

export const getDriveBasePath = () => {
  const { origin } = window.location;
  const reviewAppPhrase = 'skemail-web-pr-';
  const containerPhrase = 'skemail-web';
  // local env
  // TODO (EMAIL-565): use process.env.NODE_ENV to differentiate
  // local env once it's added to the frontend
  if (getEnvironment(new URL(origin)) === 'local') {
    return `http://localhost:1212/${DRIVE_PATH}`;
  }
  // review apps
  if (origin.includes(reviewAppPhrase)) {
    const prNumberStartIndex = origin.indexOf(reviewAppPhrase) + reviewAppPhrase.length;
    // This is <PR_NUMBER>.skiff.town (shared between editor and skemail origins for review apps)
    const reviewAppOriginSuffix = origin.slice(prNumberStartIndex);
    return `https://skeditor-web-pr-${reviewAppOriginSuffix}`;
  }

  // For skemail-web.skiff.X
  if (origin.includes(containerPhrase)) {
    const subdomainEndIndex = origin.indexOf(containerPhrase) + containerPhrase.length;
    // This is .skiff.X
    const containerOriginSuffix = origin.slice(subdomainEndIndex);
    return `https://app${containerOriginSuffix}`;
  }

  // The editor origin for dev, staging, and production are the same as skemail
  return `${origin}/${DRIVE_PATH}`;
};
