import {
  Type,
  TypographySize,
  Button,
  Dropdown,
  IconText,
  Icon,
  Divider,
  ThemeMode,
  Typography,
  themeNames,
  REMOVE_SCROLLBAR_CSS,
  Size
} from 'nightwatch-ui';
import React from 'react';
import { DateFormats } from 'skiff-front-utils';
import styled from 'styled-components';

import { SIDEBAR_WIDTH } from '../../../../constants';
import { NEW_EVENT_BTN_LABEL } from '../../../../constants/calendar.constants';
import { dateToFormatString, getEventCardKey } from '../../../../utils';
import { useCreatePendingEvent } from '../../../../utils/hooks/useCreatePendingEvent';
import { useSelectedEvent, useSelectedEventID } from '../../../../utils/hooks/useSelectedEvent';

import EventCardMonthlyView from './EventCardMonthlyView';
import {
  ALL_EVENTS_DROPDOWN_HEADER_HEIGHT,
  ALL_EVENTS_DROPDOWN_WIDTH,
  ALL_EVENTS_DROPDOWN_FOOTER_HEIGHT,
  ALL_EVENTS_DROPDOWN_CONTENT_MAX_HEIGHT
} from './MonthlyView.constants';
import { AllEventsDropdownProps } from './MonthlyView.types';

const MORE_EVENTS_DROPDOWN_CALLER = 'more-events-dropdown';

const DropdownHeader = styled.div`
  width: 100%;
  height: ${ALL_EVENTS_DROPDOWN_HEADER_HEIGHT}px;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 0px 4px 0px 8px;
  box-sizing: border-box;
`;

const DropdownFooter = styled.div`
  width: 100%;
  height: ${ALL_EVENTS_DROPDOWN_FOOTER_HEIGHT}px;

  display: flex;
  align-items: center;

  padding: 0 8px;
  box-sizing: border-box;
`;

const StyledButton = styled(Button)`
  border: 1px solid ${themeNames.dark['--border-tertiary']};
`;

const DropdownContentContainer = styled.div`
  width: 100%;
  max-height: ${ALL_EVENTS_DROPDOWN_CONTENT_MAX_HEIGHT}px;
  overflow-y: auto;

  display: flex;
  flex-direction: column;
  gap: 4px;

  padding: 8px 4px;
  box-sizing: border-box;
  ${REMOVE_SCROLLBAR_CSS}
`;

const AllEventsDropdown: React.FC<AllEventsDropdownProps> = ({
  currentDayDate,
  dayEvents,
  frozenEventIDs,
  setShowDropdown, // Dropdown component prop taken out of the spread operator
  virtualSelectedDate,
  ...dropdownProps
}: AllEventsDropdownProps) => {
  const { clearSelectedEvent, saveDraftAndCloseEventInfo } = useSelectedEvent();
  const selectedEventID = useSelectedEventID();
  const createPendingEvent = useCreatePendingEvent(true);

  const onCreateNewEventClick = async () => {
    if (selectedEventID) void saveDraftAndCloseEventInfo();
    // Keep local time bec, otherwise, the event is created on the previous day
    await createPendingEvent(currentDayDate.utc(true));
  };

  return (
    <Dropdown
      customBackgroundBlockerPos={{ top: 0, left: SIDEBAR_WIDTH }}
      // We give it a unique id because on escape we don't want this dropdown to be treated like other dropdowns
      // To make it close after sidebar on escape
      id={MORE_EVENTS_DROPDOWN_CALLER}
      noPadding
      portal
      setShowDropdown={() => {
        if (selectedEventID) return;
        setShowDropdown(false);
      }}
      width={ALL_EVENTS_DROPDOWN_WIDTH}
      {...dropdownProps}
    >
      <DropdownHeader>
        <Typography
          color='secondary'
          forceTheme={ThemeMode.DARK}
          selectable={false}
          size={TypographySize.SMALL}
          uppercase
        >
          {dateToFormatString(currentDayDate, DateFormats.ShortWithYear)}
        </Typography>
        <IconText
          color='secondary'
          forceTheme={ThemeMode.DARK}
          onClick={() => {
            setShowDropdown(false);
            clearSelectedEvent();
          }}
          startIcon={Icon.Close}
        />
      </DropdownHeader>
      <Divider color='tertiary' forceTheme={ThemeMode.DARK} />
      <DropdownContentContainer>
        {dayEvents.map((displayEvent) => (
          <EventCardMonthlyView
            currentDayDate={currentDayDate}
            displayEvent={displayEvent}
            frozenEventIDs={frozenEventIDs}
            isInAllEventsDropdown
            key={getEventCardKey(displayEvent)}
            virtualSelectedDate={virtualSelectedDate}
          />
        ))}
      </DropdownContentContainer>
      <Divider forceTheme={ThemeMode.DARK} />
      <DropdownFooter>
        <StyledButton
          compact
          forceTheme={ThemeMode.DARK}
          fullWidth
          onClick={onCreateNewEventClick}
          size={Size.SMALL}
          type={Type.SECONDARY}
        >
          {NEW_EVENT_BTN_LABEL}
        </StyledButton>
      </DropdownFooter>
    </Dropdown>
  );
};

export default AllEventsDropdown;
