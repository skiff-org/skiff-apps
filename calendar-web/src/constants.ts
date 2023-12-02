import { getBaseDomain } from './utils/envUtils';

export const DEFAULT_EVENT_COLOR = 'blue';

export const SIDEBAR_WIDTH = 264;

// This should be in the format @<domain name>. This is important for proper parsing by external
// calendar apps.
// See https://stackoverflow.com/questions/66102584/when-i-add-method-request-to-icalendar-gmail-stops-recognizing-as-event/66151376#66151376 for details.
export const EXTERNAL_ID_SUFFIX = '@skiff.com';

// match strings that ends with EXTERNAL_ID_SUFFIX
export const skiffIDRegex = /\@skiff\.com$/;

export const BASE_DOMAIN = getBaseDomain();

export const INDENTATION_SIZE = 4;

export const DAY_COLUMN_CONTAINER_ID = 'event-column-container';

// Determines how many events to recover at a on a single sync.
export const EVENTS_TO_RECOVER_CHUNK = 20;
