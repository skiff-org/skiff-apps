import dayjs from 'dayjs';
import EventEmitter from 'eventemitter3';
import debounce from 'lodash/debounce';
import {
  AccentColor,
  accentColorToPrimaryColor,
  Divider,
  getThemedColor,
  TextArea,
  ThemeMode,
  TypographyWeight
} from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { ColorSelector, DRAWER_PADDING_LEFT_RIGHT, useTheme, useToast, useUserPreference } from 'skiff-front-utils';
import { EventUpdateType } from 'skiff-graphql';
import { RecurrenceRule } from 'skiff-ics';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';

import { ConferenceProvider } from '../../../generated/protos/com/skiff/calendar/encrypted/encrypted_data';
import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { EventDiffState, useSelectedEventState } from '../../apollo/selectedEvent';
import { SIDEBAR_WIDTH } from '../../constants';
import {
  EVENT_INFO_ACTIONS_HEIGHT,
  EVENT_INFO_PADDING_LEFT_RIGHT,
  MARK_HOURS_WIDTH,
  UNTITLED_EVENT
} from '../../constants/calendar.constants';
import { DecryptedDraftModel } from '../../storage/models/draft/DecryptedDraftModel';
import { getDraftByID, saveDraft } from '../../storage/models/draft/modelUtils';
import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { getEventByID } from '../../storage/models/event/modelUtils';
import { EventAttendee, InternalAttendee, UpdateEventArgs, VideoConference } from '../../storage/models/event/types';
import {
  canUserEditEvent,
  getAttendeeFromCalendarID,
  getDraftIfExistOrEvent,
  hasStartTimeChanged,
  isOnlyPersonalPreferencesChanges,
  unixDateToStartOfDateInUTC,
  useAppSelector,
  useLocalSetting
} from '../../utils';
import {
  calculateNewEndStartWithOffsets,
  calculateNewStartTimeWithOffsets,
  roundY
} from '../../utils/dragFunctionsUtils';
import { useSelectedEventID } from '../../utils/hooks/useSelectedEvent';
import { isRecurringChild, isRecurringEvent, isRecurringParent } from '../../utils/recurringUtils';
import { ParticipantsSuggestions } from '../ParticipantSuggestions';

import EventInfoActions from './EventInfoActions';
import { LocationAndDescription } from './LocationAndDescription';
import { TimeAndDate } from './TimeAndDate';
import { DateTime } from './types';
import { cleanDescriptionFromConference, mergeDescriptionWithConference } from './VideoConference/utils';
import { EventVideoConference } from './VideoConference/VideoConference';

const EventInfoContainer = styled.div`i
  display: flex;
  flex-direction: column;
  padding: 0 ${EVENT_INFO_PADDING_LEFT_RIGHT}px ${isMobile ? 48 : 16}px;
  justify-content: space-between;
  ${!isMobile && `margin-bottom: ${EVENT_INFO_ACTIONS_HEIGHT}px;`}
`;

const EventDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${isMobile &&
  /* To overlap the top divider so that the divider only appears on scrolling */
  `margin-top: -1px;`}
`;

const TitleAndDate = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: fit-content;
`;

const DividerContainer = styled.div<{ $drawerWidth: number }>`
  ${isMobile
    ? `position: sticky;
  top: ${EVENT_INFO_ACTIONS_HEIGHT}px;
  margin-left: -${EVENT_INFO_PADDING_LEFT_RIGHT + DRAWER_PADDING_LEFT_RIGHT}px;`
    : `padding-bottom: 12px;`}
  width: ${(props) => (isMobile ? `${props.$drawerWidth + DRAWER_PADDING_LEFT_RIGHT * 2}` : `${SIDEBAR_WIDTH}`)}px;
`;

const OverlapDivider = styled.hr<{ $drawerWidth: number; $theme: ThemeMode }>`
  margin-left: -${DRAWER_PADDING_LEFT_RIGHT + EVENT_INFO_PADDING_LEFT_RIGHT}px;
  border: none;
  margin-top: 0px;
  margin-bottom: 0px;
  height: 1px;
  z-index: 0;
  ${(props) => `background: ${getThemedColor('var(--bg-l3-solid)', props.$theme)};`}
  ${(props) => `width: ${props.$drawerWidth + DRAWER_PADDING_LEFT_RIGHT * 2}px;`}
`;

const EventInfoActionsMobile = styled.div<{ $theme: ThemeMode }>`
  position: sticky;
  top: 0;
  ${(props) => `background: ${getThemedColor('var(--bg-l3-solid)', props.$theme)};`}
  z-index: 3;
  height: ${EVENT_INFO_ACTIONS_HEIGHT}px;
`;

const EventInfoActionsWeb = styled.div<{ $theme: ThemeMode }>`
  position: fixed;
  bottom: 0;
  left: 0;
  padding-bottom: 12px;
  ${(props) => `background: ${getThemedColor('var(--bg-sidepanel)', props.$theme)};`}
`;

export const EventInfoEmitter = new EventEmitter();

export enum EventInfoEmitterEvents {
  UpdateFromDB = 'update-from-db'
}

interface EventInfoProps {
  // Setter for if event info is being updated after the user tabbed out of a field
  // Necessary for not closing EventInfo and not opening UserInviteModal if the event info is still being updated
  // Optional because it's not needed on mobile
  setIsUpdatingEvent?: Dispatch<SetStateAction<boolean>>;
}

export const EventInfo: React.FC<EventInfoProps> = ({ setIsUpdatingEvent }: EventInfoProps) => {
  const { enqueueToast } = useToast();
  const calendarID = useCurrentCalendarID();

  // If the event details have been loaded
  const [isLoading, setIsLoading] = useState(true);

  // Event title
  const [eventTitle, setEventTitle] = useState<string>();
  // Event location
  const [location, setLocation] = useState<string>();
  // Event description
  const [description, setDescription] = useState<string>();
  // Event color
  const [defaultCalendarColor] = useUserPreference(StorageTypes.DEFAULT_CALENDAR_COLOR);
  const [color, setColor] = useState<AccentColor | undefined>(undefined);
  // Event start/end date and time
  const [dateTime, setDateTime] = useState<DateTime>();
  // Is event all day or not
  const [isAllDay, setIsAllDay] = useState(false);
  // Attendees for the event
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  // Video conference for the event
  const [conference, setConference] = useState<VideoConference>();
  // Event recurrence rule
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | null>();

  const { theme } = useTheme();

  // Refs
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const eventInfoContainerRef = useRef<HTMLDivElement>(null);
  const prevSelectedEventID = useRef<string>();

  const [userTimezone] = useLocalSetting(StorageTypes.TIME_ZONE);

  const selectedEventID = useSelectedEventID();
  const { diffMap, selectedEvent, selectedDraft } = useSelectedEventState();

  const calendarRef = useAppSelector((state) => state.calendar.calendarRef);

  const { yOffsets, xOffset } = useAppSelector((state) => state.eventDragging.draggingData);
  const daySnapWidth = ((calendarRef?.current?.getBoundingClientRect().width || 0) - MARK_HOURS_WIDTH) / 7;

  /**
   * calculate the event times from Drag To Create offsets
   * (debounce to avoid over-rendering and performance issues)
   */
  const updateDragDates = useCallback(
    debounce(
      (
        draft: DecryptedDraft,
        x: number,
        y: { top: number; bottom: number },
        currentTimes: DateTime,
        snapWidth: number
      ) => {
        const startDate = calculateNewStartTimeWithOffsets(
          draft.plainContent.startDate, // calculate the offset from the draft original times
          { top: roundY(y.top), bottom: roundY(y.bottom) },
          x,
          snapWidth
        );
        const endDate = calculateNewEndStartWithOffsets(
          draft.plainContent.endDate, // calculate the offset from the draft original times
          { top: roundY(y.top), bottom: roundY(y.bottom) },
          x,
          snapWidth
        );

        // update the state only there was a change in calculated times
        if (startDate !== currentTimes.startDateTime.valueOf() || endDate !== currentTimes.endDateTime.valueOf()) {
          setDateTime({
            startDateTime: dayjs(startDate).tz(userTimezone),
            endDateTime: dayjs(endDate).tz(userTimezone)
          });
        }
      },
      100, // update after 100 ms without offsets updates
      { maxWait: 100 } // make sure to update after 100 ms
    ),
    [userTimezone]
  );

  /**
   * updating the date and time showed in the Event Info to match the drag state when using Drag To Create
   */
  useEffect(() => {
    // no drag to create in mobile
    if (isMobile) return;
    // if no drag offset no need to update
    if (!yOffsets.top && !yOffsets.bottom && !xOffset) return;
    if (!dateTime || !selectedDraft) return;

    updateDragDates(selectedDraft, xOffset, yOffsets, dateTime, daySnapWidth);
    // Using this so we don't get include daySnapWidth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yOffsets, xOffset, selectedDraft?.parentEventID]);

  const diffState = diffMap?.diffState;
  const eventIsNew = diffState === EventDiffState.New;
  const recurringChild =
    (selectedEvent && isRecurringChild(selectedEvent)) || (selectedDraft && isRecurringChild(selectedDraft));

  const autoFocusTitleField = eventIsNew && !recurringChild;
  const currentUserAttendee = getAttendeeFromCalendarID(calendarID, attendees);

  const loadEventDetails = useCallback(async () => {
    if (!selectedEventID) {
      return;
    }

    // first try to query the drafts table, if theres no draft that matches the selectedEventID, query the events table
    const event = await getDraftIfExistOrEvent(selectedEventID);
    if (!event) return;

    let parentRecurrenceEvent: DecryptedEventModel | undefined;
    if (isRecurringChild(event)) {
      // In case of recurring children we need to get the parent for showing the rule - children dont have the rrule
      parentRecurrenceEvent = await getEventByID(event.plainContent.parentRecurrenceID);
    }

    const eventIsAllDay = !!event.decryptedContent.isAllDay;
    setEventTitle(event.decryptedContent.title);
    setColor(event.decryptedPreferences?.color);
    setAttendees(event.decryptedContent.attendees.filter((attendee) => !attendee.deleted));
    setLocation(event.decryptedContent.location);
    setDescription(event.decryptedContent.description);
    setConference(event.decryptedContent.conference);
    setIsAllDay(eventIsAllDay);
    setRecurrenceRule(event.plainContent.recurrenceRule || parentRecurrenceEvent?.plainContent.recurrenceRule);
    // If the event is an all day event, convert the times to UTC since time zones do not matter for all day events
    setDateTime({
      startDateTime: eventIsAllDay
        ? unixDateToStartOfDateInUTC(event.plainContent.startDate)
        : dayjs(event.plainContent.startDate).tz(userTimezone),
      endDateTime: eventIsAllDay
        ? dayjs.utc(event.plainContent.endDate)
        : dayjs(event.plainContent.endDate).tz(userTimezone)
    });

    // Check for external events conference
    if (!currentUserAttendee || !canUserEditEvent(currentUserAttendee)) {
      const googleConferenceRegex = /Join with Google Meet: (?<link>https:\/\/meet.google.com\/[a-z]+-[a-z]+-[a-z]+)/;
      const googleConference = event.decryptedContent.description?.match(googleConferenceRegex)?.groups?.link;
      if (!googleConference) return;
      setConference({
        provider: ConferenceProvider.GoogleMeet,
        link: googleConference
      });
    }
  }, [currentUserAttendee, selectedEventID, userTimezone]);

  // Refetch event when selected event ID
  useEffect(() => {
    // Event ID changes
    // Only fetch the data for the event if we select a new event
    if (selectedEventID !== prevSelectedEventID.current) {
      setIsLoading(true);
      // A new event has been selected, reset
      titleInputRef?.current?.blur();
      void loadEventDetails().then(() => {
        titleInputRef?.current?.focus();
        setIsLoading(false);
      });

      prevSelectedEventID.current = selectedEventID;
    }
  }, [selectedEventID, loadEventDetails]);

  useEffect(() => {
    const updateFromDB = () => void loadEventDetails();
    EventInfoEmitter.on(EventInfoEmitterEvents.UpdateFromDB, updateFromDB);

    return () => {
      EventInfoEmitter.removeListener(EventInfoEmitterEvents.UpdateFromDB, updateFromDB);
    };
  }, [loadEventDetails]);

  useEffect(() => {
    if (autoFocusTitleField) titleInputRef?.current?.focus();
  }, [autoFocusTitleField]);

  const updateDraftDetails = async (newDetails: UpdateEventArgs): Promise<void> => {
    if (!selectedEventID) return;

    let draft = await getDraftByID(selectedEventID);

    // if the draft still doesn't exists try to get the event associated to the selectedEventID
    if (!draft) {
      const event = await getEventByID(selectedEventID);
      // if the draft not created and there is not event that matches the selectedEventID we can't save the draft
      if (!event) {
        enqueueToast({ title: 'Could not update event', body: 'Try saving the event again' });
        return;
      }

      draft = DecryptedDraftModel.fromDecryptedEvent(event);
    }

    // if the start time has changed - reset rsvp status
    if (hasStartTimeChanged(draft, newDetails)) {
      // This checks that the non draft instance of the event is not a recurring event
      if (!selectedEvent || !isRecurringEvent(selectedEvent)) {
        if (isRecurringParent(draft) && newDetails.plainContent?.startDate)
          draft.plainContent.recurrenceRule = new RecurrenceRule({
            ...draft.plainContent.recurrenceRule,
            startDate: newDetails.plainContent.startDate
          });
      }
      draft.resetAttendeesRsvpStatus();
    }

    const newUpdateType = isOnlyPersonalPreferencesChanges(newDetails)
      ? EventUpdateType.Preferences
      : EventUpdateType.Content;
    draft.updateWithPartialDetails(newDetails, [newUpdateType]);

    await saveDraft(draft);
  };

  // only render details if there is a selected event and after all information has loaded. This will prevent layout shift
  if (!selectedEventID || isLoading || !currentUserAttendee || !calendarID) return null;

  const canEdit = canUserEditEvent(currentUserAttendee);
  // show if the event is not new or is a recurring event child (we want to enable delete for this events)
  // we check for selectedEvent to make sure it's an existing event, not being newely created (selectedEvent would be undefined in this case)
  const showEventBurgerMenuButton = !!(selectedEvent || recurringChild);

  const renderDivider = (
    <DividerContainer $drawerWidth={eventInfoContainerRef?.current?.offsetWidth || 0}>
      <Divider />
    </DividerContainer>
  );

  return (
    <EventInfoContainer ref={eventInfoContainerRef}>
      {isMobile && (
        <>
          <EventInfoActionsMobile $theme={theme}>
            <EventInfoActions
              canEdit={canEdit}
              disableSaveEvent={eventIsNew}
              showMoreOptionsButton={showEventBurgerMenuButton}
            />
          </EventInfoActionsMobile>
          {renderDivider}
        </>
      )}
      <EventDetails>
        {isMobile && <OverlapDivider $drawerWidth={eventInfoContainerRef?.current?.offsetWidth || 0} $theme={theme} />}
        <TitleAndDate>
          <TitleContainer>
            <TextArea
              autoFocus={autoFocusTitleField}
              borderRadius={isMobile ? 12 : 10}
              disabled={!canEdit}
              dynamicHeight
              innerRef={titleInputRef}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                setEventTitle(e.target.value);
                void updateDraftDetails({ decryptedContent: { title: e.target.value } });
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                // Remove focus from field when Enter is pressed
                if (e.key === 'Enter') {
                  titleInputRef.current?.blur();
                }
              }}
              placeholder='New event title'
              // Initial number of rows
              rows={1}
              value={!canEdit && !eventTitle ? UNTITLED_EVENT : eventTitle}
              weight={TypographyWeight.MEDIUM}
            />
          </TitleContainer>
          {dateTime && (
            <TimeAndDate
              dateTime={dateTime}
              isAllDay={isAllDay}
              isReadOnly={!canEdit}
              recurrenceRule={recurrenceRule}
              selectedDraft={selectedDraft}
              selectedEvent={selectedEvent}
              setDateTime={setDateTime}
              setIsAllDay={setIsAllDay}
              setIsUpdatingEvent={setIsUpdatingEvent}
              setRecurrenceRule={setRecurrenceRule}
              updateEventDetails={updateDraftDetails}
            />
          )}
        </TitleAndDate>
        <Divider />
        <ParticipantsSuggestions
          attendees={attendees}
          calendarID={calendarID}
          canEdit={canEdit}
          currentUserParticipant={currentUserAttendee as InternalAttendee}
          selectedEventID={selectedEventID}
          setAttendees={setAttendees}
          setIsUpdatingEvent={setIsUpdatingEvent}
          updateDraftDetails={updateDraftDetails}
        />
        {(canEdit || conference) && (
          <>
            <Divider />
            <EventVideoConference
              canEdit={canEdit}
              conference={conference}
              eventTitle={eventTitle}
              updateConference={async (newConference: VideoConference | undefined) => {
                setConference(newConference);
                const newDescription =
                  newConference && newConference.provider !== ConferenceProvider.Unknown
                    ? mergeDescriptionWithConference(newConference, description)
                    : cleanDescriptionFromConference(description);
                setDescription(newDescription);
                await updateDraftDetails({
                  decryptedContent: {
                    conference: newConference,
                    description: newDescription
                  }
                });
              }}
            />
          </>
        )}
        {/**
         * Only render this section if
         * 1. the user has edit access
         * 2. the user has read-only access but the description or location is defined
         */}
        {(canEdit || location || description) && (
          <>
            <Divider />
            <LocationAndDescription
              canEdit={canEdit}
              description={description}
              location={location}
              setDescription={setDescription}
              setLocation={setLocation}
              updateEventDetails={updateDraftDetails}
            />
          </>
        )}
        <ColorSelector
          colorToStyling={accentColorToPrimaryColor}
          handleChange={(selectedColor) => {
            setColor(selectedColor as AccentColor);
            void updateDraftDetails({ decryptedPreferences: { color: selectedColor as AccentColor } });
          }}
          value={color ?? defaultCalendarColor}
        />
        {!isMobile && (
          <EventInfoActionsWeb $theme={theme}>
            {renderDivider}
            <EventInfoActions
              canEdit={canEdit}
              disableSaveEvent={eventIsNew}
              showMoreOptionsButton={showEventBurgerMenuButton}
            />
          </EventInfoActionsWeb>
        )}
      </EventDetails>
    </EventInfoContainer>
  );
};
