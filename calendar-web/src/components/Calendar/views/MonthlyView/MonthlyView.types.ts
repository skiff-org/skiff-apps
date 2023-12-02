import { Dayjs } from 'dayjs';
import { AccentColor, DropdownProps, ThemeMode } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction } from 'react';

import { DisplayEvent } from '../../types';

// -- Event card --
export interface BaseEventCardProps {
  color: AccentColor;
  actualStartDate: Dayjs;
  actualEndDate: Dayjs;
  isEventConfirmed: boolean;
  isEventRejected: boolean;
  isSelected: boolean;
  isMaybeResponse: boolean;
  isPastEvent: boolean;
  title: string;
  onEventClick: (e: React.MouseEvent) => void;
  onEventRightClick: (e: React.MouseEvent) => void;
  forceTheme?: ThemeMode;
  isInAllEventsDropdown?: boolean;
  virtualSelectedDate?: Dayjs;
}

// -- Monthly display event --
type MonthlyDisplayEventProps = {
  isGhost?: boolean;
};

export type MonthlyDisplayEvent = DisplayEvent & MonthlyDisplayEventProps;

// -- All events dropdown --
type DropdownComponentProps = Pick<DropdownProps, 'buttonRef' | 'showDropdown' | 'setShowDropdown'>;

export interface AllEventsDropdownProps extends DropdownComponentProps {
  currentDayDate: Dayjs;
  dayEvents: MonthlyDisplayEvent[];
  frozenEventIDs: string[];
  setShowDropdown: Dispatch<SetStateAction<boolean>>;
  virtualSelectedDate?: Dayjs;
}
