import { ACCENT_COLOR_VALUES, AccentColor, ThemeMode, colors, getThemedColor } from 'nightwatch-ui';
import { FADED_EVENT_OPACITY, getEventColors } from 'skiff-front-utils';
import { filterExists } from 'skiff-utils';

import { DecryptedDraft } from '../../../storage/models/draft/types';
import { EventBase } from '../../../storage/models/event/types';

import { EVENT_WITH_BG_HOVER_OPACITY, EVENT_WITHOUT_BG_HOVER_OPACITY } from './views.constants';

/**
 * Given a list of events and frozen event IDs, determines whether or not any of
 * the given events are frozen.
 * A frozen event prevents the events from rendering.
 * An event will be considered as frozen if it itself is frozen or if it is a recurring event
 * and its parent event is frozen.
 */
export const isFrozen = (events: (EventBase | DecryptedDraft)[], frozenEventsIDs: string[]) => {
  const eventsIDs = events.map((event) => event.parentEventID);
  const eventsRecurrenceParentIDs = events.map((event) => event.plainContent.parentRecurrenceID).filter(filterExists);
  return frozenEventsIDs.some((id) => eventsIDs.includes(id) || eventsRecurrenceParentIDs.includes(id));
};

export const getHoveredEventBackground = (color: AccentColor, hasBackground: boolean, isFaded: boolean) => {
  const opacity =
    (isFaded ? FADED_EVENT_OPACITY : 1) *
    (hasBackground ? EVENT_WITH_BG_HOVER_OPACITY : EVENT_WITHOUT_BG_HOVER_OPACITY);
  return `rgba(${colors[`--${color}-400`]}, ${opacity})`;
};

export const getDiagonalStripes = (
  color: AccentColor,
  backgroundColor: string,
  themeMode: ThemeMode,
  isSelected?: boolean
) => {
  const [primaryColor] = getEventColors(color, themeMode, false);
  const [, secondaryAccentColor] = ACCENT_COLOR_VALUES[color];
  const stripeColor = isSelected ? `${primaryColor}c9` : getThemedColor(secondaryAccentColor, themeMode);

  return `linear-gradient(
      45deg,
      ${stripeColor} 2.63%,
      ${backgroundColor} 2.63%,
      ${backgroundColor} 50%,
      ${stripeColor} 50%,
      ${stripeColor} 52.63%,
      ${backgroundColor} 52.63%,
      ${backgroundColor} 100%
      )`;
};
