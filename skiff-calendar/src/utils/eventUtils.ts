import isEqual from 'lodash/isEqual';
import isError from 'lodash/isError';
import { isMobile } from 'react-device-detect';
import { AttendeeStatus, EventUpdateType } from 'skiff-graphql';

import { getCurrentCalendarMetadata } from '../apollo/currentCalendarMetadata';
import {
  EventDraftDiff,
  getSelectedEventState,
  EventDiffState,
  EventDiffMap,
  AttendeeDiffMap,
  attendeeOmitProps,
  FieldDiff
} from '../apollo/selectedEvent';
import { DisplayEvent } from '../components/Calendar/types';
import { EXTERNAL_ID_SUFFIX } from '../constants';
import { eventReducer } from '../redux/reducers/eventReducer';
import { modalReducer } from '../redux/reducers/modalReducer';
import {
  CalendarModalType,
  SaveDraftModalRecurringAction,
  SaveDraftModalResponse,
  SaveDraftModalSaveAction
} from '../redux/reducers/modalTypes';
import store from '../redux/store/reduxStore';
import { DecryptedDraftModel } from '../storage/models/draft/DecryptedDraftModel';
import { deleteDraftByID, getDraftByID, saveDraft } from '../storage/models/draft/modelUtils';
import {
  DecryptedDraft,
  DraftDecryptedContent,
  DraftDecryptedPreferences,
  DraftPlainContent,
  isDraft
} from '../storage/models/draft/types';
import { saveDraftToEvent } from '../storage/models/draft/utils';
import { DecryptedEventModel } from '../storage/models/event/DecryptedEventModel';
import { deleteEventByID, getEventByID } from '../storage/models/event/modelUtils';
import {
  DecryptedEvent,
  EmailContentType,
  EventAttendee,
  EventAttendeeType,
  UpdateEventArgs
} from '../storage/models/event/types';

import { filterUserFromAttendees } from './attendeeUtils';
import { dayjs } from './dateTimeUtils';
import {
  isRecurringChild,
  isRecurringEvent,
  isRecurringParent,
  performOnAllRecurrences,
  performOnSingleAndFuture,
  performOnSingleRecurrence
} from './recurringUtils';
import { shouldSendMail, markEventAsNeedToSendContentMail } from './sync/icsUtils';

// In case event is recurring we generete new parentEventIDs for the virtulized instances each time there is a change
// So for recurring we generete key by parentRecurrenceID&recurrenceDate
export const getEventCardKey = (event: DecryptedEvent | DecryptedDraft) => {
  return isRecurringChild(event)
    ? `${event.plainContent.parentRecurrenceID}-${event.plainContent.recurrenceDate}`
    : event.parentEventID;
};

export const isDiffOnlyPreferencesChanges = (diffMap: EventDraftDiff) =>
  diffMap.attendeesDiff.new.length === 0 &&
  diffMap.attendeesDiff.updated.length === 0 &&
  diffMap.attendeesDiff.deleted.length === 0 &&
  !Object.keys(diffMap.diff.decryptedContent).length &&
  !Object.keys(diffMap.diff.plainContent).length;

export const isDiffContentChanges = (diffMap: EventDraftDiff) =>
  diffMap.attendeesDiff.new.length > 0 ||
  diffMap.attendeesDiff.deleted.length > 0 ||
  Object.keys(diffMap.diff.decryptedContent).length ||
  Object.keys(diffMap.diff.plainContent).length ||
  diffMap.attendeesDiff.updated.some((attendeeDiff) =>
    Object.keys(attendeeDiff).some((key) => !['delete', 'attendeeStatus'].includes(key))
  );

export const shouldShowSaveDraftModal = (calendarID: string, isDelete = false) => {
  const { diffMap, selectedDraft, selectedEvent } = getSelectedEventState();

  const draftIsRecurringEvent = selectedDraft && isRecurringEvent(selectedDraft);
  // when updating recurring event and there are changes in the draft we always want to show the modal
  // If the event is not recurring event and the draft is recurring parent that means we are creating a new recurring event
  const updatingRecurringEvent =
    (selectedEvent && isRecurringEvent(selectedEvent)) || (draftIsRecurringEvent && !isRecurringParent(selectedDraft));

  const eventHasNonDeletedAttendees =
    selectedEvent && selectedEvent.decryptedContent.attendees.filter((attendee) => !attendee.deleted).length > 1;

  const eventIsImported = selectedEvent && !selectedEvent.externalID.includes(EXTERNAL_ID_SUFFIX);

  // Handle deletes
  if (isDelete) {
    // If we are trying to delete a draft that does not have event - no need to show the modal
    if (!selectedEvent && !draftIsRecurringEvent) return false;
    // If the event being deleted is imported, no need to show the modal
    if (eventIsImported) return false;
    // If the event being deleted is not imported and has attendees - show the modal
    if (eventHasNonDeletedAttendees && !isMobile) return true;
    // deleting recurring event
    if (updatingRecurringEvent) return true;
  }

  // updating recurring event with changes
  if (updatingRecurringEvent && diffMap?.diffState === EventDiffState.PendingChanges) return true;

  // if in mobile and the event is not recurring we never show the modal
  if (!diffMap || (isMobile && !updatingRecurringEvent)) return false;

  // No changes no need for validation
  if (diffMap.diffState === EventDiffState.Settled) return false;
  // New event with no new attendees
  // important for recurring events, where the draft can be EventDiffState.New and have attendees but from the template and no new attendees
  if (diffMap.diffState === EventDiffState.New && !diffMap.attendeesDiff.new.length) return false;

  if (isDiffOnlyPreferencesChanges(diffMap) && !draftIsRecurringEvent) return false;

  const hasDeletedAttendees = !!diffMap.attendeesDiff.deleted.length;
  const isPrivateEvent = selectedDraft?.decryptedContent.attendees.every(
    (attendee) => attendee.id === calendarID || attendee.deleted
  );

  return hasDeletedAttendees || !isPrivateEvent;
};

/**
 * check if need to show save modal.
 * if need to show, waiting for the user's interaction and return the response based on his choice
 * if no need to show the modal automatically responds with SaveDraftModalResponse.NotOpened
 * @param calendarID
 * @param isDelete
 * @returns
 */
export const showSaveDraftModalIfNeeded = async (calendarID: string, isDelete = false) => {
  // if no need to show the modal automatically respond with SaveDraftModalResponse.NotOpened
  if (!shouldShowSaveDraftModal(calendarID, isDelete)) return { saveAction: SaveDraftModalSaveAction.NotOpened };

  // wait for the users interaction and return his choice
  return new Promise<SaveDraftModalResponse>((resolve) => {
    store.dispatch(
      modalReducer.actions.setOpenModal({
        type: CalendarModalType.SaveDraft,
        callback: (response) => {
          // close the modal
          store.dispatch(modalReducer.actions.setOpenModal(undefined));
          return resolve(response);
        },
        isDelete
      })
    );
  });
};

export const isOnlyPersonalPreferencesChanges = (changes: UpdateEventArgs) =>
  Object.keys(changes as object).every((key) => key === 'decryptedPreferences');

export const getDraftIfExistOrEvent = async (parentEventID: string) =>
  (await getDraftByID(parentEventID)) || (await getEventByID(parentEventID));

const getSelectedEventSendMailType = (calendarID: string, externalOnly?: boolean): EmailContentType[] | undefined => {
  // get the saved event
  const { selectedDraft } = getSelectedEventState();
  if (!selectedDraft) return;

  const draftHasAttendees =
    selectedDraft.decryptedContent.attendees.filter((attendee) => filterUserFromAttendees(attendee, calendarID))
      .length > 0;
  const draftHasContentChanges = selectedDraft?.localMetadata.updateType.includes(EventUpdateType.Content);

  if (draftHasAttendees && draftHasContentChanges) {
    return externalOnly ? [EmailContentType.ContentExternal] : [EmailContentType.Content];
  }
};

/**
 * execute the callback while freezing the rendering of the passed events IDs
 * @param callback - action to execute
 * @param eventsToFreezeIDs - events ids which should not render during this action execution
 * @returns
 */
export const performWithFreezingEvents = async <T>(
  callback: () => T | Promise<T>,
  eventsToFreezeIDs: string[]
): Promise<T> => {
  // freeze the rendering of the passed events
  store.dispatch(eventReducer.actions.addFrozenEventIDs(eventsToFreezeIDs));
  try {
    const res = await callback();
    // release the frozen events
    store.dispatch(eventReducer.actions.removeFrozenEventIDs(eventsToFreezeIDs));
    return res;
  } catch (error) {
    console.error('Could not perform action on events', error);
    // release the frozen events
    store.dispatch(eventReducer.actions.removeFrozenEventIDs(eventsToFreezeIDs));
    throw error;
  }
};

const deleteSelectedEvent = async (
  selectedEventID: string,
  calendarID: string,
  sendToExternalOnly: boolean,
  saveDraftRecurringAction?: SaveDraftModalRecurringAction
) => {
  const { selectedEvent, selectedDraft } = getSelectedEventState();
  let eventDeleted = false;
  let draftDeleted = false;
  if (
    (!selectedEvent && !(selectedDraft && isRecurringEvent(selectedDraft))) ||
    (selectedEvent && !isRecurringEvent(selectedEvent))
  ) {
    eventDeleted = selectedEvent ? await deleteEventByID(selectedEventID, calendarID ?? '') : true;
    draftDeleted = selectedDraft ? await deleteDraftByID(selectedEventID) : true;
    await markEventAsNeedToSendContentMail(selectedEventID, sendToExternalOnly);
  } else {
    await performWithFreezingEvents(async () => {
      const deleteEventAndMarkToSendMail = (event: DecryptedEventModel) => {
        event.plainContent.deleted = true;
        event.localMetadata.updateType = [EventUpdateType.Content, EventUpdateType.Rsvp, EventUpdateType.Preferences];

        if (shouldSendMail(event, sendToExternalOnly)) {
          event.markAsNeedToSendMail(calendarID, [
            sendToExternalOnly ? EmailContentType.ContentExternal : EmailContentType.Content
          ]);
        }

        return event;
      };

      switch (saveDraftRecurringAction) {
        default:
        case SaveDraftModalRecurringAction.AllEvents:
          eventDeleted = (await performOnAllRecurrences(selectedEventID, deleteEventAndMarkToSendMail)).every(
            (deleted) => !isError(deleted) && deleted
          );
          break;
        case SaveDraftModalRecurringAction.ThisEvent:
          eventDeleted = await performOnSingleRecurrence(selectedEventID, deleteEventAndMarkToSendMail);
          break;
        case SaveDraftModalRecurringAction.ThisAndFutureEvents:
          eventDeleted = (await performOnSingleAndFuture(selectedEventID, deleteEventAndMarkToSendMail)).every(
            (deleted) => !isError(deleted) && deleted
          );
          break;
      }
      draftDeleted = selectedDraft ? await deleteDraftByID(selectedEventID) : true;
    }, [
      selectedEventID,
      selectedEvent?.plainContent.parentRecurrenceID ?? '',
      selectedDraft?.plainContent.parentRecurrenceID ?? ''
    ]);
  }
  return eventDeleted && draftDeleted;
};

/**
 * This function is used to save changes from draft to event
 * This function does not check if a saveDraft modal prompt is needed, it will just save the draft
 *
 * **Use This Wisely**, This function will not check if a saveDraft modal prompt is needed
 * You should probably use `finishEditDraftWithSaveDraftModal` instead
 *
 * return true if the draft was saved, false if the draft was not saved
 */
export const finishEditDraft = async (
  selectedEventID: string,
  calendarID: string,
  saveDraftModalResponse: SaveDraftModalResponse = { saveAction: SaveDraftModalSaveAction.Save },
  isDelete?: boolean
) => {
  const { saveAction, recurringAction } = saveDraftModalResponse;

  const sendToExternalOnly = saveAction === SaveDraftModalSaveAction.SaveWithoutSending;
  try {
    const selectedEventState = getSelectedEventState();

    if (isDelete) {
      return await deleteSelectedEvent(selectedEventID, calendarID, sendToExternalOnly, recurringAction);
    } else if (selectedEventState.diffMap?.diffState === EventDiffState.PendingChanges) {
      // important to mark the event before saving the draft, to not override the draft data with the old event
      const mailContentTypes = getSelectedEventSendMailType(calendarID, sendToExternalOnly);
      await saveDraftToEvent(selectedEventID, mailContentTypes, recurringAction);
    } else {
      await deleteDraftByID(selectedEventID);
    }
    return true;
  } catch (err) {
    console.error('Failed saving draft', err);
    return false;
  }
};

/**
 * This function is used to save changes from draft to event
 * It will check if a saveDraft modal prompt is needed, prompt it if needed and save the draft
 *
 * return true if the draft was saved, false if the draft was not saved
 */
export const finishEditDraftWithSaveDraftModal = async (
  selectedEventID: string | undefined,
  calendarID: string,
  isDelete?: boolean
) => {
  if (selectedEventID) {
    const saveDraftModalResponse = await showSaveDraftModalIfNeeded(calendarID, isDelete);
    if (saveDraftModalResponse.saveAction === SaveDraftModalSaveAction.Cancel) return false;

    return finishEditDraft(selectedEventID, calendarID, saveDraftModalResponse, isDelete);
  }
  return false;
};

const settledState: EventDraftDiff = {
  diff: {
    decryptedContent: {},
    decryptedPreferences: {},
    plainContent: {}
  },
  attendeesDiff: {
    new: [],
    deleted: [],
    updated: []
  },
  diffState: EventDiffState.Settled
};

export const getEventDraftDiff = (event: DecryptedEvent | undefined | null, draft: DecryptedDraft): EventDraftDiff => {
  if (!event && draft.localMetadata.updateType.length === 0) return { ...settledState, diffState: EventDiffState.New };

  let diffState: EventDiffState = !!event ? EventDiffState.Settled : EventDiffState.New;

  const diff: EventDiffMap = {
    decryptedContent: {},
    decryptedPreferences: {},
    plainContent: {}
  };
  const attendeesDiff: EventDraftDiff['attendeesDiff'] = {
    new: [],
    deleted: [],
    updated: []
  };

  // Assuming all values are of primitive type: boolean, string, number, null, undefined
  // If not, we need to handle them separately

  // content props
  for (const key of Object.keys(draft.decryptedContent) as (keyof DraftDecryptedContent)[]) {
    // We are handling attendees separately, it is not a primitive type
    if (key === 'attendees') continue;

    if (!isEqual(event?.decryptedContent[key], draft.decryptedContent[key])) {
      diffState = EventDiffState.PendingChanges;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      diff.decryptedContent[key] = {
        new: draft.decryptedContent[key],
        old: event?.decryptedContent[key]
      };
    }
  }

  // Preferences props
  for (const key of Object.keys(draft.decryptedPreferences || {}) as (keyof DraftDecryptedPreferences)[]) {
    if (!isEqual((event?.decryptedPreferences || {})[key], (draft.decryptedPreferences || {})[key])) {
      diffState = EventDiffState.PendingChanges;
      diff.decryptedPreferences[key] = {
        new: (draft.decryptedPreferences || {})[key],
        old: (event?.decryptedPreferences || {})[key]
      };
    }
  }

  // Plain content props
  for (const key of Object.keys(draft.plainContent) as (keyof DraftPlainContent)[]) {
    if (!isEqual(event?.plainContent[key], draft.plainContent[key])) {
      diffState = EventDiffState.PendingChanges;
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      diff.plainContent[key] = {
        new: draft.plainContent[key],
        old: event?.plainContent[key]
      } as FieldDiff<DraftPlainContent[typeof key]>;
    }
  }

  const eventAttendees = event?.decryptedContent.attendees || [];
  const draftAttendees = draft?.decryptedContent.attendees || [];

  for (const draftAttendee of draftAttendees) {
    // Unresolved attendees are non stable state, and will be resolved before saving to the event
    if (draftAttendee.type === EventAttendeeType.UnresolvedAttendee) continue;

    const eventAttendee = eventAttendees.find((attendee) => attendee.id === draftAttendee.id);

    // New attendees
    // if attendee is not in the event (and the event already created), and it is not deleted in the draft
    // or if attendee is deleted in the event, and it is not deleted in the draft
    if ((!eventAttendee && !draftAttendee.deleted) || (eventAttendee?.deleted && !draftAttendee.deleted)) {
      attendeesDiff.new.push(draftAttendee);
      continue;
    }

    // Deleted attendees
    // if attendee is not deleted in the event, and it is deleted in the draft
    if (eventAttendee && !eventAttendee.deleted && draftAttendee.deleted) {
      attendeesDiff.deleted.push(eventAttendee);
      continue;
    }

    if (eventAttendee && !eventAttendee.deleted && !draftAttendee.deleted) {
      let changed = false;
      const attendeeDiff: AttendeeDiffMap = {
        id: draftAttendee.id
      };

      for (const key of Object.keys(draftAttendee) as (keyof EventAttendee)[]) {
        // attendeeOmitProps is the props that are not relevant for the diff, or to complex to handle
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (attendeeOmitProps.includes(key)) continue;

        if (eventAttendee[key] !== draftAttendee[key]) {
          attendeeDiff[key] = {
            new: draftAttendee[key],
            old: eventAttendee[key]
          };
          changed = true;
        }
      }
      if (changed) attendeesDiff.updated.push(attendeeDiff);
    }
  }

  // If there are any changes in the attendees, we need to set the diffState to PendingChanges
  if (attendeesDiff.new.length || attendeesDiff.deleted.length || attendeesDiff.updated.length)
    diffState = EventDiffState.PendingChanges;

  return {
    diffState,
    diff,
    attendeesDiff
  };
};

/**
 * Function to get the diff between the selected event and the selected draft
 *
 * use this to determine if the draft is new, settled, or has pending changes
 * if it has new attendees, deleted attendees, or updated attendees
 * or changes in the content, preferences, or plain content
 */
export const getSelectedEventDraftDiff = async (_selectedEventID?: string): Promise<EventDraftDiff | undefined> => {
  const selectedEventID = _selectedEventID ?? store.getState().event.selectedEventID;
  if (!selectedEventID) return undefined;

  let { selectedEvent: event, selectedDraft: draft } = getSelectedEventState();
  if (!event && !draft) {
    draft = (await getDraftByID(selectedEventID)) ?? null;
    event = (await getEventByID(selectedEventID)) ?? null;
  }

  if (!draft) return settledState;

  return getEventDraftDiff(event, draft);
};

export enum UpdateRSVPResultType {
  Success,
  Error,
  Canceled
}

export interface UpdateRSVPResult {
  type: UpdateRSVPResultType;
  error?: string;
}

export const updateEventRSVP = async (
  event: DecryptedEvent | undefined | null,
  draft: DecryptedDraft | undefined | null,
  calendarID: string,
  rsvpValue: { attendeeStatus: AttendeeStatus; deleted?: boolean },
  promptRecurringModalIfNeeded = true
): Promise<UpdateRSVPResult> => {
  const calendarMetadata = await getCurrentCalendarMetadata();
  if ((!event && !draft) || !calendarMetadata)
    return {
      type: UpdateRSVPResultType.Error,
      error: 'No selected event or calendar'
    };

  const selectedEventID = event?.parentEventID || draft?.parentEventID;
  if (!selectedEventID)
    return {
      type: UpdateRSVPResultType.Error,
      error: 'No selected event'
    };

  let updatedDraft = draft;
  if (!draft) {
    if (!event)
      return {
        type: UpdateRSVPResultType.Error,
        error: 'No selected event'
      };
    updatedDraft = DecryptedDraftModel.fromDecryptedEvent(event);
  }

  if (!updatedDraft)
    return {
      type: UpdateRSVPResultType.Error,
      error: 'Failed to create draft'
    };

  // Then we update the draft with the new rsvp value

  const attendeeIndex = updatedDraft.decryptedContent.attendees.findIndex((attendee) => attendee.id == calendarID);
  updatedDraft.decryptedContent.attendees[attendeeIndex] = {
    ...updatedDraft.decryptedContent.attendees[attendeeIndex],
    ...rsvpValue,
    updatedAt: dayjs().valueOf()
  };
  updatedDraft.localMetadata.updateType = [
    ...new Set([...updatedDraft.localMetadata.updateType, EventUpdateType.Rsvp])
  ];

  // Then we save the draft
  await saveDraft(updatedDraft);

  // Now we need to save the draft to the event
  let saveDraftModalResponse: SaveDraftModalResponse = {
    saveAction: SaveDraftModalSaveAction.Save
  };

  // if needed we open the save draft modal
  if (isRecurringEvent(updatedDraft) && promptRecurringModalIfNeeded) {
    saveDraftModalResponse = await new Promise<SaveDraftModalResponse>((resolve) => {
      store.dispatch(
        modalReducer.actions.setOpenModal({
          type: CalendarModalType.SaveDraft,
          callback: (response) => {
            // close the modal
            store.dispatch(modalReducer.actions.setOpenModal(undefined));
            return resolve(response);
          },
          isDelete: false
        })
      );
    });
  }

  if (saveDraftModalResponse.saveAction === SaveDraftModalSaveAction.Cancel) {
    // If canceled we delete the draft
    await deleteDraftByID(updatedDraft.parentEventID);
    return {
      type: UpdateRSVPResultType.Canceled
    };
  }

  await saveDraftToEvent(selectedEventID, [EmailContentType.Rsvp], saveDraftModalResponse.recurringAction);
  return {
    type: UpdateRSVPResultType.Success
  };
};

export const updateSelectedEventRSVP = async (
  calendarID: string,
  rsvpValue: { attendeeStatus: AttendeeStatus; deleted?: boolean }
): Promise<UpdateRSVPResult> => {
  const { selectedDraft, selectedEvent } = getSelectedEventState();
  return updateEventRSVP(selectedEvent, selectedDraft, calendarID, rsvpValue);
};

const getEventDuration = (start: number, end: number) => end - start;

// sort by duration -> longest should appear first
export const sortByDuration = (eventA: DisplayEvent | DecryptedDraft, eventB: DisplayEvent | DecryptedDraft) =>
  getEventDuration(eventB.plainContent.startDate, eventB.plainContent.endDate) -
  getEventDuration(eventA.plainContent.startDate, eventA.plainContent.endDate);

export const sortByTitle = (eventA: DisplayEvent | DecryptedDraft, eventB: DisplayEvent | DecryptedDraft) => {
  const eventATitle = eventA.decryptedContent.title;
  const eventBTitle = eventB.decryptedContent.title;
  if (eventATitle < eventBTitle) return -1;
  if (eventATitle > eventBTitle) return 1;
  return 0;
};

/**
 * Select current event card
 * and creates a draft for recurrence if needed
 */
export const handleVirtualizedRecurrenceAndSelectEvent = async (
  event: DisplayEvent,
  setSelectedEventID: (eventID: string, isLastDisplayedEvent?: boolean | undefined) => void
) => {
  const { parentEventID, isSplitDisplayEvent, isLastDisplayedEvent } = event;
  if (isRecurringChild(event)) {
    const eventOrDraft = await getDraftIfExistOrEvent(parentEventID);
    if (!eventOrDraft) {
      // In case user select simple event or parent recurring event there is an event/draft but when it's virtualized we create a new Draft
      if (isDraft(event)) return;
      // We duplicate all the details from the parent recurring event but keep startDate/endDate
      const newDraft = DecryptedDraftModel.fromDecryptedEvent(
        await DecryptedEventModel.fromDecryptedEventWithoutKeys(event)
      );
      await saveDraft(newDraft);
    }
  }
  setSelectedEventID(parentEventID, isSplitDisplayEvent && isLastDisplayedEvent);
};
