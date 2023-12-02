import throttle from 'lodash/throttle';
import { requireCurrentUserData, getDefaultEmailAlias, getAllAliasesForCurrentUser } from 'skiff-front-utils';

import { AttendeePermission } from '../../../../generated/graphql';
import { requireCurrentCalendarID } from '../../../apollo/currentCalendarMetadata';
import { DecryptedEventModel } from '../../../storage/models/event/DecryptedEventModel';
import { saveContent } from '../../../storage/models/event/modelUtils';
import client from '../../../apollo/client';

/**
 * iterate over the events and check for events that contain the current user as an attendee.
 * if the user's attendee is saved with deprecated alias - delete the attendee or update the alias (depends on the permission)
 * @param events
 * @returns
 */
export const updateEventsWithDeletedAlias = async (events: DecryptedEventModel[]) => {
  const emailAliases = await getAllAliasesForCurrentUser(client);
  const calendarID = requireCurrentCalendarID();

  const eventsToUpdate = events.filter((event) => {
    const userAttendee = event.decryptedContent.attendees.find(
      (attendee) => attendee.id === calendarID && !attendee.deleted
    );
    // if the user is not invited - no need to delete him
    if (!userAttendee) return false;

    // we want to update only events that has deleted aliases the current user own
    return !emailAliases.includes(userAttendee.email) && userAttendee.permission === AttendeePermission.Owner;
  });

  const userData = requireCurrentUserData();
  const defaultEmailAlias = getDefaultEmailAlias(userData.userID);

  // throttle the updates to make sure we're not overloading the calendar and making it slow
  const throttledUpdate = throttle(async (event: DecryptedEventModel) => {
    // if the user is the owner he has edit permissions and we can just change the email to the his default alias
    event.updateAttendee(calendarID, { email: defaultEmailAlias });
    return saveContent(event);
  }, 300);

  await Promise.allSettled(eventsToUpdate.map(throttledUpdate));

  return !!eventsToUpdate.length;
};
