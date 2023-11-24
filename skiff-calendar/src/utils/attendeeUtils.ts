import { assert } from 'skiff-utils';

import { DecryptedEvent, EventAttendee, EventAttendeeType } from '../storage/models/event/types';

export const getAttendeeFromCalendarID = (calendarID: string | null | undefined, attendees: EventAttendee[]) => {
  if (!calendarID) return undefined;
  // The attendee id is set to the attendee's primary calendarID,
  // so we check the calendarID against the attendee id
  return attendees.find((attendee) => attendee.id === calendarID);
};

export const getAttendeeStatusByAddress = (event: DecryptedEvent, address: string) => {
  const currentUserAttendee = event.decryptedContent.attendees.find((attendee) => attendee.email === address);
  const status = currentUserAttendee?.attendeeStatus;
  assert(status, "Couldn't find user's status");

  return status;
};

export const attendeeMatchAnyAlias = (attendee: EventAttendee, aliases: string[]) =>
  aliases.some((alias) => alias === attendee.email);

// Use in a filter to remove delete attendees
export const withoutDeleted = (attendee: EventAttendee) => !attendee.deleted;

export const filterUserFromAttendees = (attendee: EventAttendee, calendarID: string): boolean =>
  !(attendee.type === EventAttendeeType.InternalAttendee && attendee.calendarID === calendarID);

export const performOnNextTik = (cb: () => void) => setTimeout(cb, 0);

export const isExistingParticipant = (currentAttendees: EventAttendee[], participant: EventAttendee) =>
  currentAttendees.some((attendee) => attendee.id === participant.id);

export const getInviteOrUpdateText = (newParticipantsAdded: boolean) => {
  const toastText = newParticipantsAdded ? 'invite' : 'update';

  return toastText;
};

export const getParticipantTitle = (participantID: string | undefined, participants: EventAttendee[]) => {
  if (!participantID) return '';
  const participant = participants.find((p) => p.id === participantID);
  return participant?.displayName || participant?.email || '';
};
