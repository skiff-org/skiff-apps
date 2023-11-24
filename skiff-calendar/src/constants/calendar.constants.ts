import { DROPDOWN_CALLER_CLASSNAME } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { DATE_PICKER_DROPDOWN_CLASSNAME, TIME_PICKER_DROPDOWN_CLASSNAME } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';

export const MOBILE_CALENDAR_VIEW_LABEL: Record<CalendarView, string> = {
  WEEKLY: 'Daily',
  MONTHLY: 'Monthly'
};

export const CALENDAR_CONTAINER_BG_COLOR = 'var(--bg-l1-solid)';

export const NEW_EVENT_BTN_LABEL = 'New event';

export const HOUR_HEIGHT = 60;
export const MARK_HOURS_WIDTH = isMobile ? 80 : 100;
export const MARK_HOURS_MARGIN_RIGHT = isMobile ? 10 : 16;

export const FIVE_MIN_HEIGHT = HOUR_HEIGHT / 12;
export const SNAP_SIZE = 3 * FIVE_MIN_HEIGHT; // 15 min snap size

// The top-bar is the date + action buttons
export const MOBILE_TOP_BAR_Y_PADDING = 24;
export const MOBILE_WEEK_VIEW_HEADER_VERTICAL_PADDING = 8;

export const EVENT_INFO_PADDING_LEFT_RIGHT = 16;
export const WEB_HEADER_HEIGHT = 35;
export const EVENT_INFO_ACTIONS_HEIGHT = 42;
export const MOBILE_HEADING_CELL_CONTAINER_HEIGHT = 108;
export const WEB_HEADING_CELL_CONTAINER_HEIGHT = 72;
export const HEADING_CELL_CONTAINER_HEIGHT = isMobile
  ? MOBILE_HEADING_CELL_CONTAINER_HEIGHT
  : WEB_HEADING_CELL_CONTAINER_HEIGHT;

// Classnames
export const NEW_EVENT_BTN_CLASSNAME = 'new-event-btn';
export const AUTOCOMPLETE_PAPER_CLASS = 'autocomplete-paper';
export const PARTICIPANT_OPTION_DROPDOWN = 'participant-option-dropdown';
export const EVENT_OPTIONS_DROPDOWN_CLASSNAME = 'event-options-dropdown';
export const SEND_INVITE_BTN = 'send-invite-btn';
export const RADIO_BUTTON_CLASS_NAME = 'radio-button';
export const REMOVE_CONFERENCE_BTN = 'remove-conference';

export const SIDEBAR_CLICK_OUTSIDE_EXCLUDED_CLASSES = [
  AUTOCOMPLETE_PAPER_CLASS,
  PARTICIPANT_OPTION_DROPDOWN,
  DATE_PICKER_DROPDOWN_CLASSNAME,
  TIME_PICKER_DROPDOWN_CLASSNAME,
  EVENT_OPTIONS_DROPDOWN_CLASSNAME,
  NEW_EVENT_BTN_CLASSNAME,
  RADIO_BUTTON_CLASS_NAME,
  'scrim',
  SEND_INVITE_BTN,
  REMOVE_CONFERENCE_BTN
];

// Ids
export const SIDEBAR_ID = 'sidebar-caller';
export const AUTOCOMPLETE_ID = 'autocomplete-caller';

export const ESCAPE_SELECTOR = `#${DROPDOWN_CALLER_CLASSNAME}, #${AUTOCOMPLETE_ID}, #${SIDEBAR_ID}`;

export const UNTITLED_EVENT = 'Untitled event';
export const MOBILE_CALENDAR_LAYOUT_ID = 'mobileCalendarLayout';

export const ALL_DAY_EVENT_HEIGHT = 30;
export const ALL_DAY_SNAP_SIZE = HOUR_HEIGHT / 2;

export const MAX_DISPLAYED_ALL_DAY_EVENTS = isMobile ? 4 : 6;
export const MAX_ALL_DAY_COLUMN_HEIGHT = isMobile ? ALL_DAY_EVENT_HEIGHT * 3.5 : ALL_DAY_EVENT_HEIGHT * 5.5;
export const ALL_DAY_COLLAPSE_LIMIT = isMobile ? 2 : 1;
export const CARD_CONTENT_MARGIN = 8;

// Shared dataTest values
export const CalendarDataTest = {
  newEventButton: 'new-event-button'
};
