// Open / close animation duration for dialog
export const CMD_PALETTE_ANIMATION_DURATION = 200;

// width should be between 300px and 500px and adjust dynamically to device width
export const CMD_PALETTE_WIDTH = '700px';

// height of a header row ("QUICK ACTIONS" or "RECENT DOCUMENTS")
export const HEADER_ROW_HEIGHT = 35;

// height of quick action or non-content search result row
export const TITLE_ONLY_ROW_HEIGHT = 50;

// height of a content search result row
export const CONTENT_SEARCH_ROW_HEIGHT = 66;

// height of command palette (display 2 headers + 6 rows by default)
export const CMD_PALETTE_HEIGHT = 2 * HEADER_ROW_HEIGHT + 6 * TITLE_ONLY_ROW_HEIGHT;

// height of notifications (display 2 headers + 6 rows by default)
export const NOTIFICATIONS_HEIGHT = 2 * HEADER_ROW_HEIGHT + 11 * TITLE_ONLY_ROW_HEIGHT;

// The interval at which to update search results based on a query (MS)
export const SEARCH_UPDATE_INTERVAL = 250;

// search version used for metrics
export const SEARCH_VERSION = '0.2.0';

// we only trigger a search after the user has stopped typing for this amount of time
export const TRIGGER_SEARCH_AFTER = 200;
