import React, { useCallback } from 'react';
import { GlobalHotKeys, configure } from 'react-hotkeys';
import { HotKeyHandlers, onHandleHotKeyPress } from 'skiff-front-utils';
import { CalendarView } from 'skiff-graphql';

import { useCurrentCalendarID } from '../../../apollo/currentCalendarMetadata';
import { useSelectedEventState } from '../../../apollo/selectedEvent';
import { canUserEditEvent, getAttendeeFromCalendarID } from '../../../utils';
import { useCurrentCalendarView } from '../../../utils/hooks/useCalendarView';
import { useSelectedEvent, useSelectedEventID } from '../../../utils/hooks/useSelectedEvent';
import { useWrapActionHandler } from '../CalendarGlobalHotKeys.hooks';

import { CALENDAR_VIEW_SHORTCUT, SINGLE_KEY_MAP, SingleKeyActions } from './SingleKeyHotKeys.constants';

configure({
  ignoreEventsCondition: () => false,
  stopEventPropagationAfterHandling: false
});

const SingleKeyHotKeys = () => {
  // Custom hooks
  const { currCalendarView, setCurrCalendarView } = useCurrentCalendarView();
  const wrapActionHandler = useWrapActionHandler(true);
  const { deleteSelectedEvent, removeSelfFromEvent } = useSelectedEvent();
  const { selectedEvent, selectedDraft } = useSelectedEventState();
  const selectedEventID = useSelectedEventID();
  const calendarID = useCurrentCalendarID();

  const attendees = selectedEvent?.decryptedContent.attendees || selectedDraft?.decryptedContent.attendees || [];
  const currentUserAttendee = getAttendeeFromCalendarID(calendarID, attendees);
  const canEdit = currentUserAttendee && canUserEditEvent(currentUserAttendee);

  // Delete event handler
  const deleteHandler = useCallback(
    (e?: KeyboardEvent) => {
      if (!selectedEventID) return;

      onHandleHotKeyPress(e);
      if (canEdit) {
        void deleteSelectedEvent();
      } else {
        void removeSelfFromEvent();
      }
    },
    [canEdit, deleteSelectedEvent, removeSelfFromEvent, selectedEventID]
  );

  const onChangeCalendarView = useCallback(
    (newCalendarView: CalendarView, e?: KeyboardEvent) => {
      onHandleHotKeyPress(e);
      setCurrCalendarView(newCalendarView);
    },
    [setCurrCalendarView]
  );

  // Calendar view handler
  const changeCalendarViewHandler = useCallback(
    (e?: KeyboardEvent) => {
      const weeklyViewShortcut = CALENDAR_VIEW_SHORTCUT[CalendarView.Weekly];
      const monthlyViewShortcut = CALENDAR_VIEW_SHORTCUT[CalendarView.Monthly];
      switch (e?.key) {
        case weeklyViewShortcut:
          if (currCalendarView === weeklyViewShortcut) return;
          // Change to Weekly
          onChangeCalendarView(CalendarView.Weekly, e);
          break;
        case monthlyViewShortcut:
        default:
          if (currCalendarView === monthlyViewShortcut) return;
          // Change to Monthly
          onChangeCalendarView(CalendarView.Monthly, e);
      }
    },
    [currCalendarView, onChangeCalendarView]
  );

  const singleKeyHandlers: HotKeyHandlers<typeof SINGLE_KEY_MAP> = {
    [SingleKeyActions.DELETE_EVENT]: wrapActionHandler(deleteHandler),
    [SingleKeyActions.CHANGE_CALENDAR_VIEW]: wrapActionHandler(changeCalendarViewHandler)
  };

  return (
    <GlobalHotKeys
      allowChanges // Permits the handlers to change after the component mounts
      handlers={singleKeyHandlers}
      keyMap={SINGLE_KEY_MAP}
    />
  );
};

export default SingleKeyHotKeys;
