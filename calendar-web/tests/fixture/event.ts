import { AttendeePermission, AttendeeStatus } from 'skiff-graphql';
import { v4 } from 'uuid';

import { EventAttendeeType, ExternalAttendee, InternalAttendee } from '../../src/storage/models/event/types';

export function createRandomInternalAttendee(
  permission: AttendeePermission,
  publicKey: string,
  username = v4(),
  options: Partial<InternalAttendee> = {}
): InternalAttendee {
  return {
    type: EventAttendeeType.InternalAttendee,
    calendarID: username,
    publicKey: { key: publicKey },
    attendeeStatus: AttendeeStatus.Pending,
    permission,
    optional: false,
    email: `${username}@skiff.test`,
    deleted: false,
    updatedAt: Date.now(),
    id: username,
    displayName: username,
    ...options
  };
}

export function createRandomExternalAttendee(
  permission: AttendeePermission,
  username = v4(),
  options: Partial<ExternalAttendee> = {}
): ExternalAttendee {
  return {
    type: EventAttendeeType.ExternalAttendee,
    attendeeStatus: AttendeeStatus.Pending,
    permission,
    optional: false,
    email: `${username}@skiff.test`,
    deleted: false,
    updatedAt: Date.now(),
    id: username,
    ...options
  };
}
