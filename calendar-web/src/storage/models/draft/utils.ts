import dayjs, { Dayjs } from 'dayjs';
import { generateSymmetricKey } from 'skiff-crypto';
import { requireCurrentUserData } from 'skiff-front-utils';
import { AttendeeStatus, AttendeePermission } from 'skiff-graphql';
import { v4 as uuidv4 } from 'uuid';

import { getCurrentCalendarMetadata } from '../../../apollo/currentCalendarMetadata';
import { EXTERNAL_ID_SUFFIX } from '../../../constants';
import { DEFAULT_EVENT_DURATION, MINUTE_UNIT } from '../../../constants/time.constants';
import { SaveDraftModalRecurringAction } from '../../../redux/reducers/modalTypes';
import { performWithFreezingEvents } from '../../../utils';
import {
  isRecurringEvent,
  performOnAllRecurrences,
  performOnSingleAndFuture,
  performOnSingleRecurrence
} from '../../../utils/recurringUtils';
import { RecurringActionCallBack } from '../../../utils/recurringUtils/performActions';
import { CalendarMetadataDB } from '../CalendarMetadata';
import { DecryptedEventModel } from '../event/DecryptedEventModel';
import { getEventByID, saveContent } from '../event/modelUtils';
import { InternalAttendeeWithPublicKey, EventAttendeeType, EmailContentType } from '../event/types';

import { DecryptedDraftModel } from './DecryptedDraftModel';
import { deleteDraftByID, getDraftByID } from './modelUtils';
import { DecryptedDraft } from './types';

interface NewDraftProps {
  startDate: Dayjs;
  endDate?: Dayjs;
  calendar: CalendarMetadataDB;
  email: string;
  displayName?: string;
  isAllDay?: boolean;
  parentEventID?: string;
  recurrenceDate?: number;
  parentRecurrenceID?: string;
}

export const generateNewDraft = (props: NewDraftProps): DecryptedDraft => {
  const {
    startDate,
    calendar,
    email,
    displayName,
    isAllDay,
    parentEventID,
    endDate,
    recurrenceDate,
    parentRecurrenceID
  } = props;
  const eventID = parentEventID || uuidv4();

  const decryptedSessionKey = generateSymmetricKey();

  const userData = requireCurrentUserData();
  const owner: InternalAttendeeWithPublicKey = {
    calendarID: calendar.calendarID,
    id: calendar.calendarID,
    attendeeStatus: AttendeeStatus.Yes,
    type: EventAttendeeType.InternalAttendee,
    permission: AttendeePermission.Owner,
    displayName,
    email,
    optional: false,
    deleted: false,
    updatedAt: dayjs().valueOf(),
    publicKey: userData.publicKey
  };

  const draft: DecryptedDraft = {
    decryptedContent: {
      location: '',
      title: '',
      description: '',
      attendees: [owner],
      isAllDay,
      conference: undefined
    },
    plainContent: {
      externalCreator: null,
      creatorCalendarID: calendar.calendarID,
      startDate: startDate.valueOf(),
      endDate: endDate?.valueOf() ?? startDate.add(DEFAULT_EVENT_DURATION, MINUTE_UNIT).valueOf(),
      parentRecurrenceID,
      recurrenceDate: recurrenceDate ?? 0,
      sequence: 0,
      reminders: [] // TODO: @yomnashaban Insert initial default reminders here
    },
    localMetadata: {
      updateType: []
    },
    parentEventID: eventID,
    externalID: parentRecurrenceID ? `${parentRecurrenceID}${EXTERNAL_ID_SUFFIX}` : `${eventID}${EXTERNAL_ID_SUFFIX}`,
    decryptedSessionKey
  };

  return draft;
};

/**
 * When choosing 'Does Not Repeat' we want to remove all the events in the recurrence rule, except the selected event
 * @param draft
 * @param calendarMetaData
 */
const handleRecurrenceRuleRemoval = async (draft: DecryptedDraftModel) => {
  // this may happen if the user removes the recurrence rule from a virtualized/instance of recurring
  // in this case we want to create a new event only for this draft without recurrence at all
  // after creating the event we want to delete the parent and all instances of the old recurrence
  if (!draft.plainContent.recurrenceRule) {
    const newEventFromRecurring = DecryptedEventModel.fromDecryptedDraft({
      ...draft,
      plainContent: {
        ...draft.plainContent,
        recurrenceRule: null,
        parentRecurrenceID: null,
        recurrenceDate: 0
      }
    });

    // save the event that from him the rule has been removed
    await saveContent(newEventFromRecurring);

    // if it wasn't the parent - delete the parent and instances
    if (draft.plainContent.parentRecurrenceID) {
      await performOnAllRecurrences(draft.plainContent.parentRecurrenceID, (instance) => {
        instance.plainContent.deleted = true;
        return instance;
      });
    }
  }
};

export const saveDraftToEvent = async (
  eventID: string,
  markToSendMailTypes?: EmailContentType[],
  saveDraftRecurringAction?: SaveDraftModalRecurringAction
) => {
  const calendarMetaData = await getCurrentCalendarMetadata();
  if (!eventID || !calendarMetaData) return;

  const draft = await getDraftByID(eventID);
  if (!draft) {
    console.warn('Unable to save draft: No draft in DB');
    return;
  }

  let event = await getEventByID(eventID);

  if ((!event || !isRecurringEvent(event)) && !draft.plainContent.parentRecurrenceID) {
    if (event) {
      // if the event already exists - update him with the draft content
      event.updateWithDraftContent(draft);
    } else {
      // if the event doesn't exist - create him with the drafts content
      event = DecryptedEventModel.fromDecryptedDraft(draft);
    }

    if (markToSendMailTypes?.length) {
      event.markAsNeedToSendMail(calendarMetaData.calendarID, markToSendMailTypes);
    }

    await saveContent(event);
    await deleteDraftByID(eventID);
  } else {
    await performWithFreezingEvents(async () => {
      const saveAndMarkMail: RecurringActionCallBack = async (instance, shouldUpdateSingleEvent, isParent) => {
        if (markToSendMailTypes?.length) {
          instance.markAsNeedToSendMail(calendarMetaData.calendarID, markToSendMailTypes);
        }
        await instance.updateRecurrenceWithDraftOrEventContent(draft, shouldUpdateSingleEvent, isParent);
        return instance;
      };
      switch (saveDraftRecurringAction) {
        default:
        case SaveDraftModalRecurringAction.AllEvents:
          await performOnAllRecurrences(eventID, saveAndMarkMail);
          break;
        case SaveDraftModalRecurringAction.ThisEvent:
          await performOnSingleRecurrence(eventID, saveAndMarkMail);
          break;
        case SaveDraftModalRecurringAction.ThisAndFutureEvents:
          await performOnSingleAndFuture(eventID, saveAndMarkMail);
          break;
      }

      await handleRecurrenceRuleRemoval(draft);
      await deleteDraftByID(eventID);
    }, [draft.parentEventID, draft.plainContent.parentRecurrenceID ?? '']);
  }
};
