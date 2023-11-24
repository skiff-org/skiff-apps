import { requireCurrentUserData } from 'skiff-front-utils';
import { AttendeePermission, AttendeeStatus, EventUpdateType } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { getCurrentCalendarMetadata } from '../../../apollo/currentCalendarMetadata';
import { toDecryptedDraft, toManyDecryptedDrafts } from '../../../crypto/cryptoWebWorker';
import { decryptSessionKeysForEncryptedEvent } from '../../crypto/utils';
import { EncryptedDraft } from '../../schemas/draft';
import { DecryptedEvent, UpdateEventArgs } from '../event/types';

import {
  DecryptedDraft,
  DraftDecryptedContent,
  DraftDecryptedPreferences,
  DraftLocalMetadata,
  DraftPlainContent
} from './types';

export class DecryptedDraftModel implements DecryptedDraft {
  decryptedContent: DraftDecryptedContent;

  plainContent: DraftPlainContent;

  decryptedSessionKey: string;

  decryptedPreferenceSessionKey?: string | undefined;

  decryptedPreferences?: DraftDecryptedPreferences;

  localMetadata: DraftLocalMetadata;

  parentEventID: string;

  externalID: string;

  protected constructor(args: DecryptedDraft) {
    this.decryptedContent = args.decryptedContent;
    this.decryptedPreferences = args.decryptedPreferences;
    this.plainContent = args.plainContent;
    this.decryptedSessionKey = args.decryptedSessionKey;
    this.decryptedPreferenceSessionKey = args.decryptedPreferenceSessionKey;
    this.localMetadata = args.localMetadata;
    this.parentEventID = args.parentEventID;
    this.externalID = args.externalID;
  }

  static async fromDexie(dexieDraft: EncryptedDraft) {
    const calendarMetadata = await getCurrentCalendarMetadata();
    assertExists(calendarMetadata, 'decryptSessionKeyForEncryptedEvent: Calendar does not exist!');
    const userData = requireCurrentUserData();

    const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
      userData.privateUserData.privateKey,
      userData.publicKey
    );
    const { contentSessionKey, preferencesSessionKey } = decryptSessionKeysForEncryptedEvent(
      dexieDraft,
      activeCalendarPrivateKey,
      calendarMetadata.publicKey
    );
    const decryptedEvent = await toDecryptedDraft(dexieDraft, contentSessionKey, preferencesSessionKey);
    return new DecryptedDraftModel(decryptedEvent);
  }

  static async fromManyDexie(dexieEvents: EncryptedDraft[]) {
    const calendarMetadata = await getCurrentCalendarMetadata();
    assertExists(calendarMetadata, 'decryptSessionKeyForEncryptedEvent: Calendar does not exist!');
    const userData = requireCurrentUserData();

    const activeCalendarPrivateKey = calendarMetadata.getDecryptedCalendarPrivateKey(
      userData.privateUserData.privateKey,
      userData.publicKey
    );

    const draftsProps = dexieEvents.map((dexieDraft) => {
      const { contentSessionKey, preferencesSessionKey } = decryptSessionKeysForEncryptedEvent(
        dexieDraft,
        activeCalendarPrivateKey,
        calendarMetadata.publicKey
      );
      return {
        sessionKey: contentSessionKey,
        preferencesSessionKey,
        draft: dexieDraft
      };
    });

    const decryptedDrafts = await toManyDecryptedDrafts(draftsProps);
    return decryptedDrafts.map((decryptedDraft) => new DecryptedDraftModel(decryptedDraft));
  }

  static fromDecryptedDraft(args: DecryptedDraft) {
    return new DecryptedDraftModel(args);
  }

  static fromDecryptedEvent(event: DecryptedEvent) {
    return new DecryptedDraftModel({
      externalID: event.externalID,
      parentEventID: event.parentEventID,
      decryptedContent: {
        title: event.decryptedContent.title,
        description: event.decryptedContent.description,
        location: event.decryptedContent.location,
        attendees: event.decryptedContent.attendees,
        isAllDay: event.decryptedContent.isAllDay,
        conference: event.decryptedContent.conference
      },
      decryptedPreferences: {
        color: event.decryptedPreferences?.color
      },
      plainContent: {
        creatorCalendarID: event.plainContent.creatorCalendarID,
        startDate: event.plainContent.startDate,
        endDate: event.plainContent.endDate,
        recurrenceRule: event.plainContent.recurrenceRule,
        recurrenceDate: event.plainContent.recurrenceDate,
        parentRecurrenceID: event.plainContent.parentRecurrenceID,
        sequence: event.plainContent.sequence,
        externalCreator: event.plainContent.externalCreator,
        reminders: event.plainContent.reminders
      },
      localMetadata: {
        updateType: event.localMetadata.updateType
      },
      decryptedSessionKey: event.decryptedSessionKey,
      decryptedPreferenceSessionKey: event.decryptedPreferenceSessionKey
    });
  }

  resetAttendeesRsvpStatus() {
    this.decryptedContent.attendees.forEach((attendee) => {
      if (attendee.permission === AttendeePermission.Owner) return;
      attendee.attendeeStatus = AttendeeStatus.Pending;
    });
  }

  updateWithPartialDetails(newDetails: UpdateEventArgs, updateTypes?: EventUpdateType[]) {
    this.decryptedContent = {
      ...this.decryptedContent,
      ...newDetails.decryptedContent
    };

    this.plainContent = {
      ...this.plainContent,
      ...newDetails.plainContent
    };

    this.decryptedPreferences = {
      ...this.decryptedPreferences,
      ...newDetails.decryptedPreferences
    };

    this.localMetadata = {
      updateType: [...new Set([...this.localMetadata.updateType, ...(updateTypes || [])])]
    };
  }
}
