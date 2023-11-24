import { wrap } from 'comlink';
import { RecurrenceRule } from 'skiff-ics';

import { DecryptedDraft } from '../../storage/models/draft/types';
import { DecryptedEvent, ExternalAttendee, InternalAttendee } from '../../storage/models/event/types';
import { EncryptedDraft } from '../../storage/schemas/draft';
import { EncryptedEvent } from '../../storage/schemas/event';

import { CryptoWorkerClass, DecryptDraftProps, DecryptEventProps } from './worker';

// All encryption and decryption of event done in a WebWorker to remove load from the main thread
// the encryption and decryption function exported as pure functions so no need to handle any WebWorker api in order to encrypt/decrypt

const worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

const CryptoWorker = wrap<typeof CryptoWorkerClass>(worker);

const cryptoWorkerGetter = new CryptoWorker();
const getCryptoWorker = () => cryptoWorkerGetter;

/**
 * Re-generate the RecurrenceRule instance because all the data is going through JSON.stringify in the worker messages
 * @param event
 */
const reInitializeRecurrenceRule = (event: DecryptedEvent | DecryptedDraft) => {
  event.plainContent.recurrenceRule = event.plainContent.recurrenceRule
    ? new RecurrenceRule(event.plainContent.recurrenceRule)
    : null;
};

/**
 * encrypt event using WebWorker
 * @param decryptedEvent
 * @param calendarPublicKey
 * @param activeCalendarPrivateKey
 * @param attendees
 * @returns
 */
export async function toEncryptedEvent(
  decryptedEvent: DecryptedEvent,
  calendarPublicKey: string,
  activeCalendarPrivateKey: string,
  attendees: { externalAttendees: ExternalAttendee[]; internalAttendees: InternalAttendee[] }
): Promise<EncryptedEvent> {
  const cryptoWorker = await getCryptoWorker();
  return cryptoWorker.encryptEvent(decryptedEvent, calendarPublicKey, activeCalendarPrivateKey, attendees);
}

/**
 * decrypt event using WebWorker
 * @param event
 * @param sessionKey
 * @param preferencesSessionKey
 * @returns
 */
export async function toDecryptedEvent(
  event: EncryptedEvent,
  sessionKey: string,
  preferencesSessionKey?: string
): Promise<DecryptedEvent> {
  const cryptoWorker = await getCryptoWorker();
  const decryptedEvent = await cryptoWorker.decryptEvent({ event, sessionKey, preferencesSessionKey });
  reInitializeRecurrenceRule(decryptedEvent);
  return decryptedEvent;
}

/**
 * decrypt events using WebWorker
 * @param event
 * @param sessionKey
 * @param preferencesSessionKey
 * @returns
 */
export async function toManyDecryptedEvents(events: DecryptEventProps[]): Promise<DecryptedEvent[]> {
  const cryptoWorker = await getCryptoWorker();
  const decryptedEvents = await cryptoWorker.decryptManyEvents(events);
  decryptedEvents.forEach((decryptedEvent) => reInitializeRecurrenceRule(decryptedEvent));
  return decryptedEvents;
}

/**
 * encrypt draft using WebWorker
 * @param decryptedDraft
 * @param calendarPublicKey
 * @param activeCalendarPrivateKey
 * @param attendees
 * @returns
 */
export async function toEncryptedDraft(
  decryptedDraft: DecryptedDraft,
  calendarPublicKey: string,
  activeCalendarPrivateKey: string,
  attendees: { externalAttendees: ExternalAttendee[]; internalAttendees: InternalAttendee[] }
): Promise<EncryptedDraft> {
  const cryptoWorker = await getCryptoWorker();
  return cryptoWorker.encryptDraft(decryptedDraft, calendarPublicKey, activeCalendarPrivateKey, attendees);
}

/**
 * decrypt draft using WebWorker
 * @param draft
 * @param sessionKey
 * @param preferencesSessionKey
 * @returns
 */
export async function toDecryptedDraft(
  draft: EncryptedDraft,
  sessionKey: string,
  preferencesSessionKey?: string
): Promise<DecryptedDraft> {
  const cryptoWorker = await getCryptoWorker();
  const decryptedDraft = await cryptoWorker.decryptDraft({ draft, sessionKey, preferencesSessionKey });
  reInitializeRecurrenceRule(decryptedDraft);
  return decryptedDraft;
}

/**
 * decrypt drafts using WebWorker
 */
export async function toManyDecryptedDrafts(drafts: DecryptDraftProps[]): Promise<DecryptedDraft[]> {
  const cryptoWorker = await getCryptoWorker();
  const decryptedDrafts = await cryptoWorker.decryptManyDrafts(drafts);
  decryptedDrafts.forEach((decryptedDraft) => reInitializeRecurrenceRule(decryptedDraft));
  return decryptedDrafts;
}
