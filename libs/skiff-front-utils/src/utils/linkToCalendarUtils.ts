// Get origin for calendar.
import { CALENDAR_PATH } from '../constants';

import { getEnvironment } from './envUtils';

export const getCalendarBasePath = () => {
  const { origin } = window.location;
  const reviewAppPhrase = 'skalendar-web-pr-';
  const containerPhrase = 'skalendar-web';

  // local env
  if (getEnvironment(new URL(origin)) === 'local') {
    return `http://localhost:1212/${CALENDAR_PATH}`;
  }

  // review apps
  if (origin.includes(reviewAppPhrase)) {
    const prNumberStartIndex = origin.indexOf(reviewAppPhrase) + reviewAppPhrase.length;
    // This is <PR_NUMBER>.skiff.town (shared between origins for review apps)
    const reviewAppOriginSuffix = origin.slice(prNumberStartIndex);
    return `https://skalendar-web-pr-${reviewAppOriginSuffix}`;
  }

  // For skalendar-web.skiff.X
  if (origin.includes(containerPhrase)) {
    const subdomainEndIndex = origin.indexOf(containerPhrase) + containerPhrase.length;
    // This is .skiff.X
    const containerOriginSuffix = origin.slice(subdomainEndIndex);
    return `https://app${containerOriginSuffix}`;
  }

  // The origin for dev, staging, and production are the same
  return `${origin}/${CALENDAR_PATH}`;
};
