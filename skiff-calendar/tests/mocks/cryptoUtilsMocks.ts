import { EventAttendee } from '../../src/storage/models/event/types';

export const decryptSessionKeysForEncryptedEvent = () => ({
  contentSessionKey: '',
  preferencesSessionKey: ''
});

export const requireAllResolvedAndSplitAttendees = (attendees: EventAttendee[]) => {
  return attendees;
};
