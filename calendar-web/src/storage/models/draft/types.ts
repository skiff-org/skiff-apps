import {
  EventDecryptedContent,
  EventDecryptedPreferences,
  EventPlainContent,
  EventLocalMetadata,
  DecryptedEvent
} from '../event/types';

/**
 * =======================================================
 *                    Draft Type
 * =======================================================
 */

export type DraftPlainContent = Omit<EventPlainContent, 'lastUpdateKeyMap' | 'deleted'>;
export type DraftLocalMetadata = Pick<EventLocalMetadata, 'updateType'>;
export type DraftDecryptedContent = Omit<EventDecryptedContent, 'lastUpdateKeyMap'>;
export type DraftDecryptedPreferences = Omit<EventDecryptedPreferences, 'lastUpdateKeyMap'>;

export interface DecryptedDraft {
  parentEventID: string;
  externalID: string;

  decryptedContent: DraftDecryptedContent;
  plainContent: DraftPlainContent;
  localMetadata: DraftLocalMetadata;

  decryptedSessionKey: string;
  decryptedPreferenceSessionKey?: string;
  decryptedPreferences?: DraftDecryptedPreferences;
}

/**
 * determine if the Event object passed is a draft or an event.
 * Events will always have the 'syncState', and draft won't (because they are not synced with the server)
 * @param draftOrEvent
 * @returns
 */
export function isDraft(draftOrEvent: DecryptedDraft | DecryptedEvent): draftOrEvent is DecryptedDraft {
  return !Object.keys(draftOrEvent.localMetadata).includes('syncState');
}

export const isEvent = (draftOrEvent: DecryptedDraft | DecryptedEvent): draftOrEvent is DecryptedEvent =>
  !isDraft(draftOrEvent);
