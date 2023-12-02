import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import { AttendeeStatus, AttendeePermission, EventUpdateType } from 'skiff-graphql';
import { v4 as uuidv4 } from 'uuid';

import { useCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import { eventReducer } from '../../redux/reducers/eventReducer';
import { DrawerTypes, mobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { SaveDraftModalSaveAction } from '../../redux/reducers/modalTypes';
import { DecryptedDraftModel } from '../../storage/models/draft/DecryptedDraftModel';
import { getDraftByID, saveDraft } from '../../storage/models/draft/modelUtils';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { getEventByID } from '../../storage/models/event/modelUtils';
import {
  shouldShowSaveDraftModal,
  finishEditDraft,
  showSaveDraftModalIfNeeded,
  finishEditDraftWithSaveDraftModal,
  UpdateRSVPResultType,
  updateSelectedEventRSVP
} from '../eventUtils';

import { useAppSelector } from './useAppSelector';

export const useSelectedEventID = () => {
  const { selectedEventID } = useAppSelector((state) => state.event);
  return selectedEventID;
};

export const useSelectedEvent = () => {
  // Redux
  const dispatch = useDispatch();
  const { enqueueToast } = useToast();

  const selectedEventID = useSelectedEventID();
  const calendarID = useCurrentCalendarID();

  const clearSelectedEvent = () => {
    dispatch(eventReducer.actions.setSelectedEventID({ eventID: undefined }));

    if (!isMobile) return;
    dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.EventInfo));
    dispatch(mobileDrawerReducer.actions.closeDrawer(DrawerTypes.CreateEvent));
  };

  const saveDraftAndCloseEventInfo = async () => {
    if (!calendarID) return;

    const saved = await finishEditDraftWithSaveDraftModal(selectedEventID, calendarID);
    if (!saved) return;

    clearSelectedEvent();
  };

  const setSelectedEventID = (eventID: string, isLastDisplayedEvent?: boolean) =>
    dispatch(eventReducer.actions.setSelectedEventID({ eventID, isLastDisplayedEvent }));

  const deleteSelectedEvent = async () => {
    const renderErrorToast = () =>
      enqueueToast({ title: 'Could not delete event', body: 'Try deleting the event again' });
    const renderSuccessToast = (shouldOpenModal: boolean) => {
      const deletionSuccessToastBody = shouldOpenModal
        ? 'A cancellation email has been sent to all participants.'
        : 'You successfully removed the event.';
      enqueueToast({ title: 'Event deleted', body: deletionSuccessToastBody });
    };

    if (!calendarID) {
      console.error('Event delete failed: calendarID is undefined');
      renderErrorToast();
      return;
    }

    if (!selectedEventID) {
      console.error('Event delete failed: selectedEventID is undefined');
      renderErrorToast();
      return;
    }

    const saveDraftModalResponse = await showSaveDraftModalIfNeeded(calendarID, true);
    if (saveDraftModalResponse.saveAction === SaveDraftModalSaveAction.Cancel) return;

    const success = await finishEditDraft(selectedEventID, calendarID, saveDraftModalResponse, true);
    if (!success) {
      renderErrorToast();
      return;
    }

    renderSuccessToast(shouldShowSaveDraftModal(calendarID));
    clearSelectedEvent();
  };

  const removeSelfFromEvent = async () => {
    const renderErrorToast = (reason?: string) => {
      enqueueToast({
        title: 'Could not delete event',
        body: reason || 'Try deleting the event again'
      });
      return;
    };

    if (!calendarID) {
      renderErrorToast();
      return;
    }

    const result = await updateSelectedEventRSVP(calendarID, { attendeeStatus: AttendeeStatus.No, deleted: true });

    if (result.type !== UpdateRSVPResultType.Success) {
      if (result.type === UpdateRSVPResultType.Error) renderErrorToast(result.error);
      return;
    }

    enqueueToast({ title: 'Event deleted', body: 'Event deleted for you.' });

    clearSelectedEvent();
  };

  const duplicateEvent = async (eventID: string) => {
    // Create a copy of the selected event with new IDs
    let copiedEvent = await getEventByID(eventID);

    // if no event to copy we check if there is a draft
    if (!copiedEvent) {
      const draft = await getDraftByID(eventID);
      if (!draft || !calendarID) return;

      // if theres an active draft, first save it
      await finishEditDraftWithSaveDraftModal(eventID, calendarID);
      copiedEvent = DecryptedEventModel.fromDecryptedDraft(draft);
    }

    // if still no event to copy return
    if (!copiedEvent) return;

    // Reset RSVP statuses except for the duplicator
    const newAttendees = copiedEvent.decryptedContent.attendees.map((attendee) =>
      attendee.id === calendarID
        ? { ...attendee, attendeeStatus: AttendeeStatus.Yes, permission: AttendeePermission.Owner }
        : {
            ...attendee,
            attendeeStatus: AttendeeStatus.Pending,
            permission:
              attendee.permission === AttendeePermission.Owner ? AttendeePermission.Read : attendee.permission,
            isNew: true
          }
    );

    const newEventID = uuidv4();
    const newEventDraft = DecryptedDraftModel.fromDecryptedEvent({
      ...copiedEvent,
      plainContent: {
        ...copiedEvent.plainContent,
        recurrenceDate: 0,
        parentRecurrenceID: undefined,
        recurrenceRule: null // always duplicate the event as not recurring
      },
      decryptedContent: {
        ...copiedEvent.decryptedContent,
        attendees: newAttendees,
        title: `${copiedEvent.decryptedContent.title}`
      },
      localMetadata: {
        ...copiedEvent.localMetadata,
        updateType: [EventUpdateType.Content, EventUpdateType.Rsvp]
      },
      parentEventID: newEventID
    });

    await saveDraft(newEventDraft);
    dispatch(eventReducer.actions.setSelectedEventID({ eventID: newEventID }));

    enqueueToast({ title: 'Event duplicated', body: 'Copy of event added to your calendar.' });
  };

  return {
    deleteSelectedEvent,
    removeSelfFromEvent,
    clearSelectedEvent,
    duplicateEvent,
    setSelectedEventID,
    saveDraftAndCloseEventInfo
  };
};
