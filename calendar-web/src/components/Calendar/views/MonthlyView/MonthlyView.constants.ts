import { isMobile } from 'react-device-detect';

// -- Day cell --
// There are no borders between month view day cells on Mobile
export const DAY_CELL_VERTICAL_BORDER_WIDTH = isMobile ? 0 : 1;

// -- Event card --
export const EVENT_CARD_HEIGHT = 20;
export const EXPANDED_EVENT_CARD_HEIGHT = 40;

// -- All events dropdown --
export const ALL_EVENTS_DROPDOWN_WIDTH = 250;
export const ALL_EVENTS_DROPDOWN_HEADER_HEIGHT = 32;
export const ALL_EVENTS_DROPDOWN_FOOTER_HEIGHT = 42;
export const ALL_EVENTS_DROPDOWN_CONTENT_MAX_HEIGHT = 250;
