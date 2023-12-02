import uniq from 'lodash/uniq';
import without from 'lodash/without';
import { decryptSessionKey, generateSymmetricKey } from 'skiff-crypto';
import { requireCurrentUserData } from 'skiff-front-utils';
import { AttendeePermission, EventUpdateType, PushCalendarEventInput2, RecurrenceFrequency } from 'skiff-graphql';
import {
  CalendarMethodTypes,
  EventStatus,
  GenerateAttendee,
  GenerateEvent,
  isAllDay,
  ParsedEvent,
  RecurrenceRule
} from 'skiff-ics';
import { assert, assertExists, filterExists } from 'skiff-utils';
import { v4 } from 'uuid';

import { PulledCalendarEventsFragment } from '../../../../generated/graphql';
import {
  getCurrentCalendarID,
  getCurrentCalendarMetadata,
  requireCurrentCalendarMetadata
} from '../../../apollo/currentCalendarMetadata';
import { RECURRENCE_DAYS_ORDERED } from '../../../components/EventInfo/Recurrence/constants';
import { guessConferenceProvider } from '../../../components/EventInfo/VideoConference/utils';
import { toDecryptedEvent, toEncryptedEvent, toManyDecryptedEvents } from '../../../crypto/cryptoWebWorker';
import { withoutDeleted } from '../../../utils/attendeeUtils';
import { dayjs, getEndDateFromParsedICS, getStartDateFromParsedICS } from '../../../utils/dateTimeUtils';
import { isRecurringEvent, isRecurringParent } from '../../../utils/recurringUtils';
import { isOnlyRSVPUpdate } from '../../../utils/updateTypeUtils';
import { decryptSessionKeysForEncryptedEvent, requireAllResolvedAndSplitAttendees } from '../../crypto/utils';
import { db } from '../../db/db';
import { EncryptedEvent } from '../../schemas/event';
import { CalendarMetadataDB } from '../CalendarMetadata';
import { DecryptedDraft } from '../draft/types';
import {
  attendeesFromGraphql,
  attendeesFromParsedAttendees,
  organizerValueToMail,
  updateAttendee
} from '../EventAttendee';

import {
  DecryptedEvent,
  EmailContentType,
  EmailTypes,
  EventAttendeeType,
  EventDecryptedContent,
  EventDecryptedPreferences,
  EventLocalMetadata,
  EventPlainContent,
  EventSyncState,
  isExternalAttendee,
  isInternalAttendeeWithEncryptedSessionKey,
  isInternalAttendeeWithEncryptedSessionKeyArray,
  isUnresolvedAttendee,
  UpdateAttendeeArgs
} from './types';
import { resolveAllAttendeesAndEncryptSessionKeys } from './utils';

export class DecryptedEventModel implements DecryptedEvent {
  decryptedContent: EventDecryptedContent;

  plainContent: EventPlainContent;

  localMetadata: EventLocalMetadata;

  decryptedSessionKey: string;

  decryptedPreferenceSessionKey?: string | undefined;

  decryptedPreferences?: EventDecryptedPreferences;

  externalID: string;

  parentEventID: string;

  protected constructor(args: DecryptedEvent) {
    this.decryptedContent = args.decryptedContent;
    this.decryptedPreferences = args.decryptedPreferences;
    this.plainContent = args.plainContent;
    this.localMetadata = args.localMetadata;
    this.decryptedSessionKey = args.decryptedSessionKey;
    this.decryptedPreferenceSessionKey = args.decryptedPreferenceSessionKey;
    this.parentEventID = args.parentEventID;
    this.externalID = args.externalID;
  }

  static fromDecryptedEvent(args: DecryptedEvent) {
    return new DecryptedEventModel(args);
  }

  static async fromDecryptedEventWithoutKeys(args: DecryptedEvent) {
    const calendarMetadata = await requireCurrentCalendarMetadata();
    const userData = requireCurrentUserData();

    const sessionKey = generateSymmetricKey();

    const newEvent = new DecryptedEventModel({
      ...args,
      decryptedContent: {
        ...args.decryptedContent,
        attendees: args.decryptedContent.attendees.map((attendee) => {
          if (isUnresolvedAttendee(attendee) || isExternalAttendee(attendee)) return attendee;
          return {
            ...attendee,
            type: EventAttendeeType.UnresolvedAttendee,
            encryptedSessionKey: undefined,
            encryptedBy: undefined
          };
        })
      },
      localMetadata: {
        ...args.localMetadata,
        // create the draft without updateTypes to make sure that even if the parent event is still not sync the draft will be created as New
        updateType: []
      },
      decryptedSessionKey: sessionKey,
      decryptedPreferenceSessionKey: undefined
    });

    await resolveAllAttendeesAndEncryptSessionKeys(
      newEvent,
      calendarMetadata,
      userData.privateUserData.privateKey,
      userData.publicKey
    );

    return newEvent;
  }

  static async fromDexie(dexieEvent: EncryptedEvent) {
    const calendarMetadata = await getCurrentCalendarMetadata();
    assertExists(calendarMetadata, 'decryptSessionKeyForEncryptedEvent: Calendar does not exist!');
    const userData = requireCurrentUserData();

    const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
      userData.privateUserData.privateKey,
      userData.publicKey
    );
    const { contentSessionKey, preferencesSessionKey } = decryptSessionKeysForEncryptedEvent(
      dexieEvent,
      activeCalendarPrivateKey,
      calendarMetadata.publicKey
    );
    const decryptedEvent = await toDecryptedEvent(dexieEvent, contentSessionKey, preferencesSessionKey);
    return new DecryptedEventModel(decryptedEvent);
  }

  static async fromManyDexie(dexieEvents: EncryptedEvent[]) {
    const calendarMetadata = await getCurrentCalendarMetadata();
    assertExists(calendarMetadata, 'decryptSessionKeyForEncryptedEvent: Calendar does not exist!');
    const userData = requireCurrentUserData();

    const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
      userData.privateUserData.privateKey,
      userData.publicKey
    );

    const eventsProps = dexieEvents.map((dexieEvent) => {
      const { contentSessionKey, preferencesSessionKey } = decryptSessionKeysForEncryptedEvent(
        dexieEvent,
        activeCalendarPrivateKey,
        calendarMetadata.publicKey
      );
      return {
        sessionKey: contentSessionKey,
        preferencesSessionKey,
        event: dexieEvent
      };
    });

    const decryptedEvents = await toManyDecryptedEvents(eventsProps);
    return decryptedEvents.map((decryptedEvent) => new DecryptedEventModel(decryptedEvent));
  }

  /**
   * create new event from draft, populate fields that draft doesn't holds with default values
   * @param draft
   * @returns
   */
  static fromDecryptedDraft(draft: DecryptedDraft) {
    return new DecryptedEventModel({
      ...draft,
      externalID: draft.externalID,
      plainContent: {
        ...draft.plainContent,
        deleted: false,
        lastUpdateKeyMap: {}
      },
      localMetadata: {
        eventEmails: { sent: [], queue: [] },
        currentMailTimestamp: 0,
        requestMailTimestamp: 0,
        syncState: EventSyncState.Waiting,
        updatedAt: Date.now(),
        updateType: draft.localMetadata.updateType
      },
      decryptedContent: {
        ...draft.decryptedContent,
        lastUpdateKeyMap: {}
      },
      decryptedPreferences: {
        ...draft.decryptedPreferences,
        lastUpdateKeyMap: {}
      }
    });
  }

  /**
   * Used to update a currently existing event with new data from an ICS received via an event update email.
   */
  static fromParsedICSUpdate(
    parsedEvent: ParsedEvent,
    existingEvent: DecryptedEventModel,
    allUserAliases: string[],
    withRecurring = false
  ) {
    const decryptedSessionKey = generateSymmetricKey();

    const isAllDayEvent = isAllDay(parsedEvent.startDate, parsedEvent.endDate);

    return new DecryptedEventModel({
      parentEventID: existingEvent ? existingEvent.parentEventID : v4(),
      externalID: parsedEvent.id,
      plainContent: {
        deleted: parsedEvent.status === EventStatus.Canceled || parsedEvent.method === CalendarMethodTypes.Cancel,
        creatorCalendarID: existingEvent.plainContent.creatorCalendarID,
        startDate: getStartDateFromParsedICS(parsedEvent.startDate, parsedEvent.endDate),
        endDate: getEndDateFromParsedICS(parsedEvent.startDate, parsedEvent.endDate),
        sequence: parsedEvent.sequence,
        externalCreator: existingEvent.plainContent.externalCreator,
        lastUpdateKeyMap: existingEvent.plainContent.lastUpdateKeyMap,
        recurrenceDate: existingEvent ? existingEvent.plainContent.recurrenceDate : 0,
        parentRecurrenceID: existingEvent ? existingEvent.plainContent.parentRecurrenceID : undefined,
        reminders: existingEvent.plainContent.reminders ?? [], // TODO: @yomnashaban Insert what we want to insert for ics updates
        ...(withRecurring && {
          recurrenceRule:
            parsedEvent.recurrenceRule || (existingEvent ? existingEvent.plainContent.recurrenceRule : undefined)
        })
      },
      localMetadata: {
        currentMailTimestamp: existingEvent.localMetadata.currentMailTimestamp,
        requestMailTimestamp: existingEvent.localMetadata.requestMailTimestamp,
        eventEmails: existingEvent.localMetadata.eventEmails,
        syncState: EventSyncState.Waiting,
        updatedAt: Date.now(),
        updateType: [EventUpdateType.Content, EventUpdateType.Rsvp]
      },
      decryptedContent: {
        title: parsedEvent.title,
        description: parsedEvent.description,
        location: parsedEvent.location,
        lastUpdateKeyMap: existingEvent.decryptedContent.lastUpdateKeyMap,
        attendees: parsedEvent.attendees
          .map((attendee) =>
            updateAttendee(
              attendee,
              existingEvent,
              allUserAliases,
              organizerValueToMail(parsedEvent.organizer?.value || '') === attendee.email
            )
          )
          .filter(filterExists),
        conference: parsedEvent.conference
          ? { link: parsedEvent.conference, provider: guessConferenceProvider(parsedEvent.conference) }
          : undefined,
        isAllDay: isAllDayEvent
      },
      decryptedPreferences: {
        lastUpdateKeyMap: existingEvent.decryptedPreferences?.lastUpdateKeyMap || {},
        color: existingEvent.decryptedPreferences?.color
      },
      decryptedSessionKey
    });
  }

  static async fromParsedICS(
    parsedEvent: ParsedEvent,
    creatorCalendarID: string,
    externalCreator: string | null = null,
    parentRecurrenceID?: string,
    parentRule?: RecurrenceRule,
    withRecurring = false,
    fromScheduler = false
  ): Promise<DecryptedEventModel[]> {
    const decryptedSessionKey = generateSymmetricKey();
    const isAllDayEvent = isAllDay(parsedEvent.startDate, parsedEvent.endDate);
    const attendees = await attendeesFromParsedAttendees(parsedEvent.attendees, parsedEvent.organizer, fromScheduler);

    const parentEventID = v4();

    // If it is a recurring all day event, we need to set the time to its local time so that
    // when set it to start of day, it would be set to the correct day
    if (isAllDayEvent && withRecurring && parsedEvent.recurrenceRule?.startDate) {
      parsedEvent.recurrenceRule.startDate = dayjs(parsedEvent.recurrenceRule.startDate).utc(true).valueOf();
    }

    const parent = new DecryptedEventModel({
      parentEventID,
      externalID: parsedEvent.id,
      plainContent: {
        deleted: parsedEvent.status === EventStatus.Canceled || parsedEvent.method === CalendarMethodTypes.Cancel,
        creatorCalendarID,
        startDate: getStartDateFromParsedICS(parsedEvent.startDate, parsedEvent.endDate),
        // some calendars set the end day of all-day events as the start of the next day - so we need to trim it to make sure it will take only one day
        endDate: getEndDateFromParsedICS(parsedEvent.startDate, parsedEvent.endDate),
        externalCreator,
        reminders: [], // TODO: @yomnashaban Insert what we want to insert for ics
        ...(withRecurring
          ? {
              recurrenceDate: parsedEvent.recurrenceId ? parsedEvent.recurrenceId.valueOf() : 0,
              recurrenceRule: parsedEvent.recurrenceRule || parentRule,
              parentRecurrenceID
            }
          : {
              recurrenceDate: 0
            }),
        lastUpdateKeyMap: {},
        sequence: parsedEvent.sequence
      },
      decryptedContent: {
        description: parsedEvent.description,
        title: parsedEvent.title,
        location: parsedEvent.location,
        lastUpdateKeyMap: {},
        attendees,
        isAllDay: isAllDayEvent,
        conference: parsedEvent.conference
          ? { link: parsedEvent.conference, provider: guessConferenceProvider(parsedEvent.conference) }
          : undefined
      },
      localMetadata: {
        syncState: EventSyncState.Waiting,
        currentMailTimestamp: 0,
        requestMailTimestamp: 0,
        eventEmails: { sent: [], queue: [] },
        updatedAt: Date.now(),
        updateType: [EventUpdateType.Content, EventUpdateType.Rsvp]
      },
      decryptedPreferences: {
        lastUpdateKeyMap: {}
      },
      decryptedSessionKey
    });

    let parsedRecurrences: DecryptedEventModel[] = [];
    if (parsedEvent.recurrences?.length) {
      await Promise.all(
        parsedEvent.recurrences.map(async (recurrence) => {
          const decryptedEvent = await DecryptedEventModel.fromParsedICS(
            recurrence,
            creatorCalendarID,
            externalCreator,
            parentEventID,
            parsedEvent.recurrenceRule,
            withRecurring
          );
          return decryptedEvent;
        })
      ).then((result) => {
        parsedRecurrences = result.flat();
      });
    }

    return [parent, ...parsedRecurrences];
  }

  static async fromGraphql(
    gqlEvent: PulledCalendarEventsFragment,
    activeCalendarPrivateKey: string,
    activeCalendarPublicKey: string
  ) {
    const decryptedSessionKey = decryptSessionKey(gqlEvent.encryptedSessionKey, activeCalendarPrivateKey, {
      key: gqlEvent.encryptedByKey
    });

    const decryptedPreferenceSessionKey = gqlEvent.encryptedPreferencesSessionKey
      ? decryptSessionKey(gqlEvent.encryptedPreferencesSessionKey, activeCalendarPrivateKey, {
          key: activeCalendarPublicKey
        })
      : undefined;

    const lastUpdateKeyMap = {};
    Object.entries(gqlEvent.lastUpdateKeyMap || {}).forEach(([key, value]) => {
      if (key === '__typename') return;
      lastUpdateKeyMap[key] = value || 0;
    });

    const encryptedEvent: EncryptedEvent = {
      ...gqlEvent,
      encryptedContent: {
        encryptedData: gqlEvent.encryptedContent
      },
      externalCreator: gqlEvent.externalCreator || null,
      currentMailTimestamp: 0,
      requestMailTimestamp: 0,
      eventEmails: { sent: [], queue: [] },
      syncState: EventSyncState.Done,
      updateType: [],
      sequence: gqlEvent.sequence,
      internalAttendees: attendeesFromGraphql(gqlEvent.internalAttendeeList),
      lastUpdateKeyMap,
      recurrenceDate: gqlEvent.recurrenceDate ?? 0,
      parentRecurrenceID: gqlEvent.parentRecurrenceID ?? undefined,
      reminders: gqlEvent.reminders ?? [],
      recurrenceRule: gqlEvent.recurrenceRule
        ? new RecurrenceRule({
            ...gqlEvent.recurrenceRule
          }).toJsonString()
        : undefined
    };

    const decryptedEvent = await toDecryptedEvent(encryptedEvent, decryptedSessionKey, decryptedPreferenceSessionKey);
    return DecryptedEventModel.fromDecryptedEvent(decryptedEvent);
  }

  async toGraphqlPush(
    calendarID: string,
    calendarMetaData: CalendarMetadataDB,
    activeCalendarPrivateKey: string
  ): Promise<PushCalendarEventInput2> {
    const attendeesForEncryption = requireAllResolvedAndSplitAttendees(this.decryptedContent.attendees);
    // All attendees must be resolved before encrypting for sync to the server.
    const encryptedEvent = await toEncryptedEvent(
      this,
      calendarMetaData.publicKey,
      activeCalendarPrivateKey,
      attendeesForEncryption
    );
    const resolvedAttendees = encryptedEvent.internalAttendees;
    assert(
      isInternalAttendeeWithEncryptedSessionKeyArray(resolvedAttendees),
      'All attendees must be resolved before encrypting for push.'
    );

    const lastUpdateKeyMap = {};
    Object.entries(encryptedEvent.lastUpdateKeyMap || {}).forEach(([key, value]) => {
      if (key === '__typename') return;
      lastUpdateKeyMap[key] = new Date(value || 0);
    });

    const pushEvent: PushCalendarEventInput2 = {
      creatorCalendarID: this.plainContent.creatorCalendarID,
      calendarID,
      eventData: {
        encryptedContent: encryptedEvent.encryptedContent.encryptedData,
        endDate: new Date(encryptedEvent.endDate),
        startDate: new Date(encryptedEvent.startDate),
        deleted: encryptedEvent.deleted ?? false,
        externalID: this.externalID,
        encryptedPreferences: encryptedEvent.encryptedPreferences,
        encryptedCalendarEventSessionKey: encryptedEvent.encryptedPreferencesSessionKey,
        lastUpdateKeyMap,
        recurrenceDate: new Date(this.plainContent.recurrenceDate),
        parentRecurrenceID: this.plainContent.parentRecurrenceID,
        recurrenceRule: this.plainContent.recurrenceRule?.toGraphqlInput(),
        sequence: this.plainContent.sequence,
        reminders: [] // TODO: @yomnashaban provide reminders here for backend
      },
      updateTypes: this.localMetadata.updateType || [],
      internalAttendeeList: resolvedAttendees.map((internalAttendee) => ({
        email: internalAttendee.email,
        calendarID: internalAttendee.calendarID,
        optional: internalAttendee.optional,
        permission: internalAttendee.permission,
        status: internalAttendee.attendeeStatus,
        displayName: internalAttendee.displayName ? internalAttendee.displayName : undefined,
        deleted: internalAttendee.deleted || false,
        updatedAt: new Date(internalAttendee.updatedAt),
        encryptedSessionKey: internalAttendee.encryptedSessionKey,
        encryptedByKey: internalAttendee.encryptedByKey
      })),
      parentEventID: this.parentEventID
    };

    return pushEvent;
  }

  /**
   * Returns a GenerateEvent object that can be used to generate an ics
   */
  toGenerateEvent(): GenerateEvent {
    const isParentRecurrence = isRecurringParent(this);
    const notRecurring = !isRecurringEvent(this);
    const attendees: GenerateAttendee[] = this.decryptedContent.attendees.filter(withoutDeleted);
    const generateEvent = {
      title: this.decryptedContent.title,
      description: this.decryptedContent.description,
      startDate: this.plainContent.startDate,
      endDate: this.plainContent.endDate,
      externalID: this.externalID,
      location: this.decryptedContent.location,
      isAllDay: this.decryptedContent.isAllDay,
      attendees: attendees,
      updatedAt: this.localMetadata.updatedAt,
      conference: this.decryptedContent.conference?.link,
      recurrenceRule: isParentRecurrence ? this.plainContent.recurrenceRule || undefined : undefined,
      recurrenceID:
        isParentRecurrence || notRecurring ? undefined : new Date(this.plainContent.recurrenceDate) || undefined,
      sequence: this.plainContent.sequence
    };
    return generateEvent;
  }

  localUpdateAttendee(id: string, args: UpdateAttendeeArgs) {
    const attendeeIndex = this.decryptedContent.attendees.findIndex((attendee) => attendee.id == id);
    this.decryptedContent.attendees[attendeeIndex] = {
      ...this.decryptedContent.attendees[attendeeIndex],
      ...args
    };
  }

  updateAttendee(id: string, args: UpdateAttendeeArgs) {
    const attendeeIndex = this.decryptedContent.attendees.findIndex((attendee) => attendee.id == id);
    this.decryptedContent.attendees[attendeeIndex] = {
      ...this.decryptedContent.attendees[attendeeIndex],
      ...args,
      updatedAt: dayjs().valueOf()
    };
  }

  deleteAttendee(id: string) {
    const attendeeIndex = this.decryptedContent.attendees.findIndex((attendee) => attendee.id === id);
    this.decryptedContent.attendees[attendeeIndex] = {
      ...this.decryptedContent.attendees[attendeeIndex],
      deleted: true,
      // If isNew = false, set to true to send uninvite mail.
      // If isNew = true, set to false. An invite mail has not been sent yet so no need to send an uninvite one
      isNew: !this.decryptedContent.attendees[attendeeIndex].isNew,
      updatedAt: dayjs().valueOf()
    };
  }

  markAsNeedToSendMail(currentCalendarID: string, updateType: EmailContentType[] = []) {
    // Should not rsvp yourself

    const owner = this.decryptedContent.attendees.filter(
      (attendee) => attendee.permission === AttendeePermission.Owner
    )[0];
    if (owner?.id === currentCalendarID) {
      updateType = without(updateType, EmailContentType.Rsvp);
    }
    if (updateType.length === 0) return; // Don't update markers if no new update types are added
    this.localMetadata.eventEmails.queue = uniq([...this.localMetadata.eventEmails.queue, ...updateType]);
    this.localMetadata.requestMailTimestamp = Date.now();
  }

  markSentEmailTypes(emailsSent: EmailTypes[]) {
    this.localMetadata.eventEmails.sent = uniq([...this.localMetadata.eventEmails.sent, ...emailsSent]);
  }

  updateMailTimestamp(requestedMailTimestamp: number) {
    this.localMetadata.currentMailTimestamp = requestedMailTimestamp;
  }

  clearEventMails() {
    this.localMetadata.eventEmails = { sent: [], queue: [] };
  }

  shouldSendMail() {
    return this.localMetadata.currentMailTimestamp < this.localMetadata.requestMailTimestamp;
  }

  addToUpdateType(updateTypes: EventUpdateType[]) {
    this.localMetadata.updateType = [...new Set([...this.localMetadata.updateType, ...updateTypes])];
  }

  updateWithDraftContent(draft: DecryptedDraft) {
    // update the attendees if the there is rsvp updates
    if (draft.localMetadata.updateType.includes(EventUpdateType.Rsvp)) {
      this.decryptedContent.attendees = draft.decryptedContent.attendees;
    }

    // update all the content if there are content updates
    if (draft.localMetadata.updateType.includes(EventUpdateType.Content)) {
      // update content
      this.decryptedContent = {
        ...this.decryptedContent,
        ...draft.decryptedContent
      };

      // update plain content
      this.plainContent = {
        ...this.plainContent,
        ...draft.plainContent
      };
    }

    // update preferences
    // if the preferences didn't change in the draft - keep the preferences fro the old event
    if (draft.localMetadata.updateType.includes(EventUpdateType.Preferences)) {
      this.decryptedPreferences = {
        ...(this.decryptedPreferences || {}),
        ...(draft.decryptedPreferences || {}),
        lastUpdateKeyMap: this.decryptedPreferences?.lastUpdateKeyMap || {}
      };
    }

    // update only the update type
    this.localMetadata = {
      ...this.localMetadata,
      updateType: [...new Set([...this.localMetadata.updateType, ...draft.localMetadata.updateType])]
    };
  }

  /**
   * update the attendees from the draft but keep the `encryptedSessionKey` that relevant to this event
   * *
   * if the draft only updates `RSVP` without any `Content` updates, we want to update only the current attendee.
   * @param draft
   */
  updateAttendeesButKeepSessionKeys(draft: DecryptedDraft) {
    // if only rsvp update - change only the current user attendee (to prevent not change all instances with the status of the current instance)
    if (isOnlyRSVPUpdate(draft.localMetadata.updateType)) {
      const calendarID = getCurrentCalendarID();
      assertExists(calendarID, 'updateAttendeesButKeepSessionKeys: CalendarID is not defined');

      const newAttendee = draft.decryptedContent.attendees.find((currentAttendee) => currentAttendee.id === calendarID);
      assertExists(newAttendee, 'updateAttendeesButKeepSessionKeys: Current user is not attendee of the draft');

      // update the current attendee only with rsvp related fields to prevent
      this.updateAttendee(calendarID, {
        attendeeStatus: newAttendee.attendeeStatus,
        optional: newAttendee.optional,
        deleted: newAttendee.deleted
      });
    } else {
      // update all attendees with the draft content - but keep the original keys
      this.decryptedContent.attendees = draft.decryptedContent.attendees.map((newAttendee) => {
        const thisAttendee = this.decryptedContent.attendees.find(
          (currentAttendee) => currentAttendee.id === newAttendee.id
        );

        if (thisAttendee && isInternalAttendeeWithEncryptedSessionKey(thisAttendee)) {
          return {
            ...newAttendee,
            encryptedSessionKey: thisAttendee.encryptedSessionKey,
            encryptedByKey: thisAttendee.encryptedByKey,
            updatedAt: thisAttendee.updatedAt
          };
        }

        return newAttendee;
      });
    }
  }

  async updateRecurrenceWithDraftOrEventContent(
    draft: DecryptedDraft | DecryptedEvent,
    isDirectInstanceUpdate: boolean,
    updatingTheParent?: boolean
  ) {
    assert(db, 'updateRecurrenceWithDraftOrEventContent: DB not initialized');

    const updateTypeContainsContent = draft.localMetadata.updateType.includes(EventUpdateType.Content);
    const updateTypeContainsRsvp = draft.localMetadata.updateType.includes(EventUpdateType.Rsvp);

    // Attendees can change in RSVP and Content update types
    if (updateTypeContainsContent || updateTypeContainsRsvp) {
      // We are updating and keeping the session keys for the attendees
      this.updateAttendeesButKeepSessionKeys(draft);
    }

    // if the content changed in the draft - update the event with the draft's content
    if (updateTypeContainsContent) {
      // update content
      this.decryptedContent = {
        ...this.decryptedContent,
        ...draft.decryptedContent,
        // we update the attendees in different place to preserve the sessionKey that relevant to this event
        attendees: this.decryptedContent.attendees
      };

      // important to query parent only if there is `Content` update type - to prevent permissions problems for readers
      const parent = await db.events.get(draft.plainContent.parentRecurrenceID || draft.parentEventID);
      assertExists(parent, 'Parent event not found');

      const isParent = !this.plainContent.parentRecurrenceID;

      // Event length in milliseconds
      const newEventLength = draft.plainContent.endDate - draft.plainContent.startDate;

      let startDate = this.plainContent.startDate;

      if (isDirectInstanceUpdate) {
        // This is a direct instance update, that means the draft is for this event / this is the parent
        const draftIsNotTheParent = !!draft.plainContent.recurrenceDate;
        if (updatingTheParent && draftIsNotTheParent) {
          // We are handling here the case that we are updating the parent from a non parent draft
          // In that case we need to update the start date by the difference between the recurrence date and the start date
          const startDateDiff = draft.plainContent.recurrenceDate - draft.plainContent.startDate;
          startDate = this.plainContent.startDate - startDateDiff;
        } else {
          startDate = draft.plainContent.startDate;
        }
      } else {
        // If this is an non direct instance update, we need to update the start date of the event to the recurrence date
        // This basically "resets" the event start date to be by the recurrence rule
        startDate = this.plainContent.recurrenceDate;
      }

      const endDate = startDate + newEventLength;

      // Update recurrence rule

      // If the recurrence rule is null, it means that the event is not recurring anymore
      // If the recurrence rule is undefined, it means that the event is recurring and the rule is the same
      let recurrenceRule =
        draft.plainContent.recurrenceRule === null
          ? null
          : draft.plainContent.recurrenceRule || this.plainContent.recurrenceRule;

      if (isParent) {
        // If parent event is updated, we need to update the recurrence rule with the new start date
        if (recurrenceRule) {
          let byDays = recurrenceRule.byDays;
          // If the rule is weekly and has a single day in each week we want to shift the day
          // This will prevent a dissepearing affect, because the startDate changes but the byDay stays the same
          if (byDays && recurrenceRule.frequency === RecurrenceFrequency.Weekly && byDays.length === 1) {
            byDays = [RECURRENCE_DAYS_ORDERED[dayjs.utc(startDate).day()]];
          }
          recurrenceRule = new RecurrenceRule({ ...recurrenceRule, startDate, byDays });
        } else {
          recurrenceRule = null;
        }
      } else {
        // If child event is updated, we need to update the recurrence rule with the parent recurrence rule
        recurrenceRule = parent.recurrenceRule ? RecurrenceRule.fromJsonString(parent.recurrenceRule) : recurrenceRule;
      }

      // update plain content
      this.plainContent = {
        ...this.plainContent,
        ...draft.plainContent,
        recurrenceRule,
        parentRecurrenceID: this.plainContent.parentRecurrenceID,
        recurrenceDate: this.plainContent.recurrenceDate,
        startDate,
        endDate,
        deleted: this.plainContent.deleted
      };
    }
    // update preferences
    // if the preferences didn't change in the draft - keep the preferences fro the old event
    if (draft.localMetadata.updateType.includes(EventUpdateType.Preferences)) {
      this.decryptedPreferences = {
        ...(this.decryptedPreferences || {}),
        ...(draft.decryptedPreferences || {}),
        lastUpdateKeyMap: this.decryptedPreferences?.lastUpdateKeyMap || {}
      };
    }

    this.localMetadata = {
      ...this.localMetadata,
      updateType: [...new Set([...this.localMetadata.updateType, ...draft.localMetadata.updateType])]
    };
  }
}
