import partition from 'lodash/partition';
import { decryptSessionKey } from 'skiff-crypto';

import { EventAttendee, isExternalAttendee, isUnresolvedAttendee } from '../models/event/types';
import { EncryptedDraft } from '../schemas/draft';
import { EncryptedEvent } from '../schemas/event';

/**
 * prepare attendees for decryption
 * @param attendees
 * @returns
 */
export const requireAllResolvedAndSplitAttendees = (attendees: EventAttendee[]) => {
  const [unresolvedAttendees, resolvedAttendees] = partition(attendees, isUnresolvedAttendee);
  if (unresolvedAttendees.length !== 0) throw Error('Event has unresolved attendees');

  const [externalAttendees, internalAttendees] = partition(resolvedAttendees, isExternalAttendee);

  return {
    externalAttendees,
    internalAttendees
  };
};

/**
 * Decrypts an event using the encrypted session key stored in the event.
 *
 * TODO(easdar) - eventually we should pass private/public keys as parameters instead of grabbing them from the db.
 * @param event
 * @returns
 */
export function decryptSessionKeysForEncryptedEvent(
  event: EncryptedEvent | EncryptedDraft,
  activeCalendarPrivateKey: string,
  activeCalendarPublicKey: string
) {
  return {
    contentSessionKey: decryptSessionKey(event.encryptedSessionKey, activeCalendarPrivateKey, {
      key: event.encryptedByKey
    }),
    preferencesSessionKey: event.encryptedPreferencesSessionKey
      ? decryptSessionKey(event.encryptedPreferencesSessionKey, activeCalendarPrivateKey, {
          key: activeCalendarPublicKey
        })
      : undefined
  };
}
