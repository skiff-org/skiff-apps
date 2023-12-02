import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useCurrentUserEmailAliases, useToast } from 'skiff-front-utils';

import { useRequiredCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import {
  finishEditDraftWithSaveDraftModal,
  getAttendeeFromCalendarID,
  handleVirtualizedRecurrenceAndSelectEvent
} from '../../utils';
import { useSelectedEvent, useSelectedEventID } from '../../utils/hooks/useSelectedEvent';

import { DisplayEvent } from './types';

export const useEventClick = (displayEvent: DisplayEvent, isDragging?: boolean) => {
  const { attendees } = displayEvent.decryptedContent;
  const { isSplitDisplayEvent, isLastDisplayedEvent, parentEventID } = displayEvent;

  const dispatch = useDispatch();

  const { enqueueToast } = useToast();
  const calendarID = useRequiredCurrentCalendarID();
  const { emailAliases: aliases } = useCurrentUserEmailAliases();
  const selectedEventID = useSelectedEventID();
  const { setSelectedEventID } = useSelectedEvent();
  const currUserAttendee = getAttendeeFromCalendarID(calendarID, attendees);

  // True if the user's attendee has an invalid alias
  const invalidAlias = currUserAttendee && !(aliases || []).includes(currUserAttendee.email);

  // Select event
  const onEventClick = async () => {
    // In case the event is corrupted and we can't open it, toast the user to contact the owner
    if (invalidAlias) {
      enqueueToast({
        title: 'Invalid invite address',
        body: 'The email invited to the event is no longer valid. Please contact the event creator to update the invite in order to access the event details.'
      });
    }

    // Clear unsaved new event if selected event isn't the new event
    if (selectedEventID === parentEventID) return;

    if (selectedEventID) {
      const saved = await finishEditDraftWithSaveDraftModal(selectedEventID, calendarID);
      if (!saved) return;
    }

    await handleVirtualizedRecurrenceAndSelectEvent(displayEvent, setSelectedEventID);

    // Refocusing to dragged event if we can
    if (isDragging) {
      setSelectedEventID(parentEventID, isSplitDisplayEvent && isLastDisplayedEvent);
      return;
    }

    // Select the clicked event
    setSelectedEventID(parentEventID, isSplitDisplayEvent && isLastDisplayedEvent);

    if (isMobile) {
      dispatch(mobileDrawerReducer.actions.openDrawer(DrawerTypes.EventInfo));
    }
  };

  return onEventClick;
};
