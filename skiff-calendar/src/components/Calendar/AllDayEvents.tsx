import { Dayjs } from 'dayjs';
import range from 'lodash/range';
import { Icon, Icons, IconText, REMOVE_SCROLLBAR_CSS, Size, TypographyWeight } from 'nightwatch-ui';
import { useEffect, useRef, useState } from 'react';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useUserPreference } from 'skiff-front-utils';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import {
  ALL_DAY_COLLAPSE_LIMIT,
  ALL_DAY_EVENT_HEIGHT,
  MAX_ALL_DAY_COLUMN_HEIGHT,
  MAX_DISPLAYED_ALL_DAY_EVENTS
} from '../../constants/calendar.constants';
import { DAY_UNIT, WEEK_UNIT } from '../../constants/time.constants';
import { CalendarRef } from '../../redux/reducers/calendarReducer';
import { getDraftByID } from '../../storage/models/draft/modelUtils';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { getEventByID } from '../../storage/models/event/modelUtils';
import { DecryptedEvent } from '../../storage/models/event/types';
import { useAppSelector, useLocalSetting } from '../../utils';
import { useGetDayIndexInView } from '../../utils/hooks/useGetDayIndexInView';
import { useSelectedEventID } from '../../utils/hooks/useSelectedEvent';

import { SingleAllDayEventColumn } from './DayColumn';

const AllDayEventsContainer = styled.div<{
  $daysToShow: number;
  $disableScroll?: boolean;
  $height: number;
}>`
  box-shadow: var(--shadow-l1);
  background: var(--bg-l2-solid);
  display: grid;
  grid-template-columns: var(--scale-mark-width) repeat(${(props) => props.$daysToShow}, 1fr);
  grid-column: 1 / 9;
  box-sizing: border-box;
  ${!isMobile && 'border-top: 1px solid var(--border-secondary)'};
  height: ${(props) => props.$height}px;
  overflow-y: ${(props) => (props.$disableScroll ? 'hidden' : 'unset')};
  overflow-x: hidden;
  ${REMOVE_SCROLLBAR_CSS}
`;

const LabelCell = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const WebIconTextContainer = styled.div<{ $isExpanded: boolean }>`
  height: 32px;
  display: flex;
  align-items: center;
  ${(props) => props.$isExpanded && 'margin-bottom: auto;'}
`;

const StyledIconTextTypographyWeb = styled.div<{ $showIcon: boolean }>`
  margin-left: ${({ $showIcon }) => ($showIcon ? '20' : '40')}px;
`;

const MobileIconContainer = styled.div<{ $showIcon: boolean }>`
  position: sticky;
  top: 8px;
  margin-left: 50px;
  margin-bottom: auto;
  visibility: ${({ $showIcon }) => ($showIcon ? 'unset' : 'hidden')};
`;

interface AllDayEventsProps {
  daysToShow: number;
  firstDay: Dayjs;
  allDayEventsInView: DecryptedDraft[][];
}
const EVENT_CARD_BORDER_HEIGHT = 2; // gives the all day section enough extra pixels to show the event drag border.
const findSpaceForNewEvent = (takenLocations: number[]) => {
  // we will start on the last location because we assume that all places on the grid are taken.
  let lowestPossiblePoint = takenLocations.length;
  takenLocations.some((takenLocation, takenLocationIndex) => {
    // we check if the event location block corresponds with its index.
    // if we have two events on the day, and blocking = [30], it means the event setting
    // at top = 30 does not correspond with its index, which is 0.
    // so, we have free space at top = 0, so we will place the new event there.
    const eventIndexInGrid = takenLocation / ALL_DAY_EVENT_HEIGHT;

    if (eventIndexInGrid > takenLocationIndex) {
      lowestPossiblePoint = takenLocationIndex;
      return true;
    }
  });
  return lowestPossiblePoint;
};

const getEventPosition = (allEvents: (DecryptedEvent | DecryptedDraft)[][]) => {
  const calculatedEventLocations = new Map<string, number>();
  /**
   * Tagged event - event we have calculated the positioning for.
   * `allEvents` contain 7 lists, each represent day's worth of events.
   * we run on each day, and check which events in that day are not yet
   * tagged (tagged event will be multi-day events since the occur multiple times over a week,
   * but at their first day they wont be tagged).
   * for every tagged event we add its location to the blocked locations list for the day,
   * and for event untagged, we calculate where its best location is going to be.
   * after that, we tag it, and add it to the blocked locations list.
   */
  allEvents.forEach((dayEvents) => {
    const eventTakenLocations: number[] = [];
    dayEvents.forEach((event) => {
      const currentEventLocation = calculatedEventLocations.get(event.parentEventID);
      if (currentEventLocation !== undefined) {
        eventTakenLocations.push(currentEventLocation);
        // no reason to re-calculate already tagged events.
        // they already have a location.
        return;
      }

      const lowestPossibleLocation = findSpaceForNewEvent(
        eventTakenLocations.sort((firstPos, secondPos) => (firstPos < secondPos ? -1 : 1))
      );
      const eventLocation = lowestPossibleLocation * ALL_DAY_EVENT_HEIGHT;

      calculatedEventLocations.set(event.parentEventID, eventLocation);
      eventTakenLocations.push(eventLocation);
    });
  });
  return calculatedEventLocations;
};

export const AllDayEvents: React.FC<AllDayEventsProps> = ({
  daysToShow,
  firstDay,
  allDayEventsInView
}: AllDayEventsProps) => {
  const [allDayEventsToShow, setAllDayEventsToShow] = useState<DecryptedDraft[][]>([]);

  const [userStartOfTheWeek] = useUserPreference(StorageTypes.START_DAY_OF_THE_WEEK);

  const getDayIndexInView = useGetDayIndexInView();

  const [allDayRowCollapsed, setAllDayRowCollapsed] = useLocalSetting(StorageTypes.ALL_DAY_ROW_COLLAPSED);
  const allDaySectionRef: CalendarRef = useRef(null);
  const selectedEventID = useSelectedEventID();
  const frozenEventsIDs = useAppSelector((state) => state.event.frozenEventsIDs);
  const selectedViewDate = useAppSelector((state) => state.time.selectedViewDate);

  const eventsSet = new Set<string>();
  let highestEventCountInADay = 0;

  if (isMobile) {
    highestEventCountInADay = allDayEventsToShow[0]?.length;
  } else {
    allDayEventsToShow.forEach((allEventsForTheDay) => {
      if (allEventsForTheDay.length > highestEventCountInADay) {
        highestEventCountInADay = allEventsForTheDay.length;
      }

      // counting the events without duplicates
      allEventsForTheDay.forEach((event) => {
        if (eventsSet.has(event.parentEventID)) return;
        eventsSet.add(event.parentEventID);
      });
    });
  }

  const trueHeightWithoutBorder = highestEventCountInADay * ALL_DAY_EVENT_HEIGHT;
  // set the height of the day block component
  const newHeight =
    (highestEventCountInADay < MAX_DISPLAYED_ALL_DAY_EVENTS ? trueHeightWithoutBorder : MAX_ALL_DAY_COLUMN_HEIGHT) +
    EVENT_CARD_BORDER_HEIGHT;
  // true height represent the height of all events stacked.
  // we use it to set the height of the scroll container so we will be able
  // to scroll inside all-day section, otherwise when
  // when theres more than MAX_DISPLAYED_ALL_DAY_EVENTS events will overflow !
  const trueHeight = trueHeightWithoutBorder + EVENT_CARD_BORDER_HEIGHT;

  const allDayColumnHeight =
    newHeight > EVENT_CARD_BORDER_HEIGHT ? newHeight : ALL_DAY_EVENT_HEIGHT + EVENT_CARD_BORDER_HEIGHT;
  const showCollapseToggle = highestEventCountInADay > ALL_DAY_COLLAPSE_LIMIT;

  const getEndIcon = () => {
    return !allDayRowCollapsed ? Icon.CollapseV : Icon.ExpandV;
  };

  const startOfWeek = firstDay.startOf(WEEK_UNIT).add(userStartOfTheWeek, DAY_UNIT);
  const containerHeight = allDayRowCollapsed ? ALL_DAY_EVENT_HEIGHT + EVENT_CARD_BORDER_HEIGHT : allDayColumnHeight;
  const eventLocations = getEventPosition(allDayEventsToShow);

  useEffect(() => {
    const updateCollapsedState = async () => {
      if (!selectedEventID) return;
      const draft = await getDraftByID(selectedEventID);
      const event = await getEventByID(selectedEventID);
      // if there is draft and no event it means that it's new event
      const newEventCreated = draft && !event;
      if (newEventCreated && draft.decryptedContent.isAllDay) {
        setAllDayRowCollapsed(false);
      }
    };
    void updateCollapsedState();
  }, [highestEventCountInADay, allDayRowCollapsed, selectedEventID, setAllDayRowCollapsed]);

  useEffect(() => {
    if (!isMobile) {
      setAllDayEventsToShow(allDayEventsInView);
      return;
    }

    // On Mobile, we fetch events for 3 consecutive months for both Month view and Week view,
    // considering that we can also open the Mini month view on Week view
    // So, in order to get the selected day's all-day events, we get the selected day's index relative to the first day in the view
    // With it, we can get the all-day events that we need to display
    const dayIndex = getDayIndexInView(selectedViewDate);
    if (!!allDayEventsInView[dayIndex]) setAllDayEventsToShow([allDayEventsInView[dayIndex]]);
  }, [allDayEventsInView, getDayIndexInView, selectedViewDate]);

  return (
    <>
      {(!isMobile || allDayEventsToShow[0]?.length > 0) && (
        <AllDayEventsContainer
          $daysToShow={daysToShow}
          $disableScroll={isMobile && (!showCollapseToggle || allDayRowCollapsed)}
          $height={containerHeight}
          ref={allDaySectionRef}
        >
          {isMobile && (
            <MobileIconContainer $showIcon={showCollapseToggle}>
              <Icons
                color='disabled'
                icon={getEndIcon()}
                onClick={() => {
                  if (showCollapseToggle) {
                    setAllDayRowCollapsed(!allDayRowCollapsed);
                  }
                }}
                size={Size.SMALL}
              />
            </MobileIconContainer>
          )}
          {!isMobile && (
            <LabelCell>
              <WebIconTextContainer $isExpanded={!allDayRowCollapsed}>
                <IconText
                  color='disabled'
                  disableHover
                  endIcon={showCollapseToggle ? getEndIcon() : undefined}
                  label={
                    <StyledIconTextTypographyWeb $showIcon={showCollapseToggle}>All-day</StyledIconTextTypographyWeb>
                  }
                  onClick={() => {
                    if (showCollapseToggle) {
                      setAllDayRowCollapsed(!allDayRowCollapsed);
                    }
                  }}
                  size={Size.SMALL}
                  weight={TypographyWeight.REGULAR}
                />
              </WebIconTextContainer>
            </LabelCell>
          )}
          {range(daysToShow).map((value) => (
            <SingleAllDayEventColumn
              allDayEvents={allDayEventsToShow[value]}
              allDaySectionRef={allDaySectionRef}
              date={startOfWeek.add(value, DAY_UNIT)}
              eventLocations={eventLocations}
              expandContainer={() => void setAllDayRowCollapsed(false)}
              frozenEventsIDs={frozenEventsIDs}
              height={containerHeight}
              isCollapsed={!showCollapseToggle ? false : allDayRowCollapsed}
              key={value}
              trueHeight={trueHeight > EVENT_CARD_BORDER_HEIGHT ? trueHeight : containerHeight}
              value={value}
            />
          ))}
        </AllDayEventsContainer>
      )}
    </>
  );
};
