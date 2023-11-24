import capitalize from 'lodash/capitalize';
import { ToastProps } from 'nightwatch-ui';

import { getEventByID } from '../../storage/models/event/modelUtils';
import { EventAttendeeType } from '../../storage/models/event/types';
import { dayjs } from '../../utils/dateTimeUtils';
import { getNextDateToSendMail } from '../../utils/sync/externalMailRateLimitUtils';
export enum ExternalMailCooldownType {
  NoCooldown,
  CooldownForListWithBothAttendeeTypes,
  CooldownOnlyExternalAttendeesList
}

export const getExternalMailCooldownType = async (eventID: string, calendarID: string) => {
  const event = await getEventByID(eventID);
  if (!event) {
    console.error(`isAbleToSendExternalMail: can not find event by ID ${eventID}`);
    return undefined;
  }
  const { attendees } = event.decryptedContent;
  const doesListHaveExternalAttendees = attendees.some(
    (attendee) => attendee.type === EventAttendeeType.ExternalAttendee && attendee.id !== calendarID
  );

  const doesListHaveInternalAttendees = attendees.some(
    (attendee) => attendee.type === EventAttendeeType.InternalAttendee && attendee.id !== calendarID
  );
  const dateAfterCooldown = getNextDateToSendMail(calendarID);

  const isUserInExternalMailCooldown = dayjs().isBefore(dayjs(dateAfterCooldown));

  if (!doesListHaveExternalAttendees || !isUserInExternalMailCooldown) return ExternalMailCooldownType.NoCooldown;

  const cooldownType = doesListHaveInternalAttendees
    ? ExternalMailCooldownType.CooldownForListWithBothAttendeeTypes
    : ExternalMailCooldownType.CooldownOnlyExternalAttendeesList;

  return cooldownType;
};

export const generateUpdateOrInviteToastProps = (
  cooldownType: ExternalMailCooldownType,
  updateOrInviteText: string
): ToastProps => {
  const cooldownErrorToastTitle = 'Reached max external message limit';

  // No external attendees/ no cooldown
  if (cooldownType === ExternalMailCooldownType.NoCooldown) {
    return { title: `${capitalize(updateOrInviteText)} sent`, body: `Guests have been ${updateOrInviteText}d.` };
  }

  // mixed attendees list - both external and internal
  if (cooldownType === ExternalMailCooldownType.CooldownForListWithBothAttendeeTypes) {
    return {
      body: `Sent ${updateOrInviteText} to Skiff guests only`,
      title: cooldownErrorToastTitle
    };
  }
  // if the attendee list is not mixed and there is cooldown, theres only external attendees
  return { body: `No guest will receive your ${updateOrInviteText}. `, title: cooldownErrorToastTitle };
};
