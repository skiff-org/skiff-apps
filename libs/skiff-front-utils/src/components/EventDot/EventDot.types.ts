import { AccentColor, ThemeMode } from 'nightwatch-ui';

import { EventDotType } from './EventDot.constants';

export interface EventDotProps {
  /** Event color */
  color: AccentColor;
  /** For styled components */
  className?: string;
  /** Force dot theme */
  forceTheme?: ThemeMode;
  /** Whether event is faded */
  isFaded?: boolean;
  /** Whether the event is in the all events dropdown */
  isInAllEventsDropdown?: boolean;
  /** Whether event is selected */
  isSelected?: boolean;
  /** Dot type */
  type?: EventDotType;
}
