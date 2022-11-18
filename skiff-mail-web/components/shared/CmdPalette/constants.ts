// Open / close animation duration for dialog
export const CMD_PALETTE_ANIMATION_DURATION = 200;

// width should be between 300px and 500px and adjust dynamically to device width
export const CMD_PALETTE_WIDTH = 700;

// margin between command list and border of the command palette in pixels
export const CMD_LIST_MARGIN = 16;

// gap in pixels between consecutive command list items, needed due to simultaneous presence of active and hover masks
export const INTER_MASK_GAP = 4;

// height of a header row ("QUICK ACTIONS" or "SEARCH RESULTS")
export const HEADER_ROW_HEIGHT = 40;

// height of quick action or non-content search result row, e.g. a suggested filter chip
export const TITLE_ONLY_ROW_HEIGHT = 46;

// height of a content search result row
export const SKEMAIL_ROW_HEIGHT = 60;

// height of a row displaying multiple filter chips, e.g. "Filter by..." or "Search for..."
export const CHIP_SELECTION_ROW_HEIGHT = 40;

// height of row displaying initial state, no results, or title search
export const NO_RESULTS_ROW_HEIGHT = 60;

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

// maximum number of recent searches to show
export const RECENT_SEARCH_WINDOW = 3;

// default search result Typography level
export const SEARCH_ITEM_DEFAULT_TYPOGRAPHY_LEVEL = 3;

// maximum number of quick actions shown before clicking 'View all'
export const MAX_QUICK_ACTIONS_SHOWN = 3;

// The minimum length of a query for which the search logic assumes that the user is searching for a specific item
export const MIN_SPECIFIED_QUERY_LENGTH = 4;

// The duration (in seconds) of the animation that transitions from one cell hover background to another in the CommandList
export const CELL_HOVER_SWITCH_ANIMATION_DURATION = 0.12;
