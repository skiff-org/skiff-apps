import zip from 'lodash/zip';
import { AttendeePermission } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import {
  BadRequest,
  UsersFromEmailAliasDocument,
  UsersFromEmailAliasQuery,
  UsersFromEmailAliasQueryVariables
} from '../../generated/graphql';
import client from '../apollo/client';
import {
  EventAttendee,
  EventAttendeeType,
  ExternalAttendee,
  InternalAttendeeWithPublicKey,
  UnresolvedAttendee
} from '../storage/models/event/types';

const PERMISSIONS_EDIT_EVENT = [AttendeePermission.Owner, AttendeePermission.Write];

export const canUserEditEvent = (user: EventAttendee) => PERMISSIONS_EDIT_EVENT.includes(user.permission);

/**
 * This function tries to fetch the skiff users
 * from the emails and attach the primaryCalendarID to them
 */
export const resolveAttendees = async (
  unresolvedAttendees: UnresolvedAttendee[]
): Promise<(InternalAttendeeWithPublicKey | ExternalAttendee)[]> => {
  const emailAliases: string[] = unresolvedAttendees.map((attendee) => attendee.email);

  // For all unresolved attendees, check if its a skiff user
  const userFromEmailRes = await client.query<UsersFromEmailAliasQuery, UsersFromEmailAliasQueryVariables>({
    query: UsersFromEmailAliasDocument,
    variables: {
      emailAliases
    }
  });

  const { usersFromEmailAlias } = userFromEmailRes.data;
  BadRequest.assert(emailAliases.length === unresolvedAttendees.length, 'Response length does not match the request');

  // Match the userInfo response to the attendee
  const attendeesAndUserInfo = zip(unresolvedAttendees, usersFromEmailAlias);

  // Resolve all attendees to either internal or external
  return attendeesAndUserInfo.map(([attendee, userInfo]): InternalAttendeeWithPublicKey | ExternalAttendee => {
    assertExists(attendee, 'Attendee does not exist!');

    const { email, displayName, optional, permission, attendeeStatus, isNew, deleted } = attendee;

    // External invite
    if (!userInfo)
      return {
        id: email,
        type: EventAttendeeType.ExternalAttendee,
        email,
        displayName,
        optional,
        permission,
        attendeeStatus,
        deleted,
        isNew,
        updatedAt: new Date().getTime()
      };

    // TODO make primaryCalendar not optional in the response
    assertExists(userInfo.primaryCalendar, `Cannot invite user ${userInfo.userID}, has no primaryCalendar`);
    // Internal invite
    return {
      calendarID: userInfo.primaryCalendar.calendarID,
      type: EventAttendeeType.InternalAttendee,
      email,
      displayName,
      optional,
      permission,
      attendeeStatus,
      id: userInfo.primaryCalendar.calendarID,
      deleted,
      isNew,
      updatedAt: new Date().getTime(),
      publicKey: { key: userInfo.primaryCalendar.publicKey }
    };
  });
};
