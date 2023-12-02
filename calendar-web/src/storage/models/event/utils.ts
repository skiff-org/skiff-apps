import { AttendeePermission, PublicKey } from 'skiff-graphql';

import { withoutDeleted } from '../../../utils/attendeeUtils';
import { CalendarMetadataDB } from '../CalendarMetadata';
import { encryptSessionKeysForAttendees } from '../EventAttendee';

import { DecryptedEvent } from './types';

export const resolveAllAttendeesAndEncryptSessionKeys = async (
  event: DecryptedEvent,
  calendar: CalendarMetadataDB,
  userPrivateKey: string,
  userPublicKey: PublicKey
) => {
  const attendees = await encryptSessionKeysForAttendees(
    calendar,
    userPrivateKey,
    userPublicKey,
    event.decryptedSessionKey,
    event.decryptedContent.attendees
  );
  event.decryptedContent.attendees = attendees;
};

export const getEventOwner = (event: DecryptedEvent) => {
  return event.decryptedContent.attendees.filter((attendee) => attendee.permission === AttendeePermission.Owner)[0];
};

export const getEventOwnerMetadata = (event: DecryptedEvent) => {
  return event.decryptedContent.attendees
    .filter((attendee) => attendee.permission === AttendeePermission.Owner)
    .map((attendee) => {
      return {
        displayName: attendee.displayName ?? attendee.email,
        email: attendee.email
      };
    });
};

export const getEmailAddressesForAllAttendees = (event: DecryptedEvent) => {
  return event.decryptedContent.attendees
    .filter(withoutDeleted)
    .filter((attendee) => attendee.permission !== AttendeePermission.Owner)
    .map((attendee) => {
      return attendee.email;
    });
};
