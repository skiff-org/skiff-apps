import { ApolloQueryResult } from '@apollo/client';
import { encode as encodeBase64 } from '@stablelib/base64';
import { ICalCalendarMethod, ICalEventStatus } from 'ical-generator';
import partition from 'lodash/partition';
import some from 'lodash/some';
import {
  encryptMessage,
  models,
  DecryptionServicePublicKeyQuery,
  DecryptionServicePublicKeyDocument
} from 'skiff-front-graphql';
import {
  CurrentUserEmailAliasesQuery,
  CurrentUserEmailAliasesQueryVariables,
  CurrentUserEmailAliasesDocument
} from 'skiff-front-graphql';
import { sha256 } from 'skiff-front-utils';
import { requireCurrentUserData } from 'skiff-front-utils';
import { AttendeePermission, AttendeeStatus, SendAddressRequest, SendEmailRequest } from 'skiff-graphql';
import { CalendarMethodTypes, generateICS, ParsedEvent, parseICS } from 'skiff-ics';
import { assertExists, filterExists } from 'skiff-utils';
import { v4 } from 'uuid';

import {
  GetEmailsWithUnreadIcsQuery,
  GetEmailsWithUnreadIcsDocument,
  MarkEmailAsReadIcsMutation,
  MarkEmailAsReadIcsMutationVariables,
  MarkEmailAsReadIcsDocument
} from '../../../generated/graphql';
import client from '../../apollo/client';
import { getCurrentCalendarMetadata } from '../../apollo/currentCalendarMetadata';
import { EXTERNAL_ID_SUFFIX, skiffIDRegex } from '../../constants';
import { ErrorHandlerMetadataDB } from '../../storage/models/ErrorHandlerMetadata';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { mergeAndSetAttendees, mergeEvents } from '../../storage/models/event/mergeUtils';
import { getEventByID, getEventsByExternalID, saveContent, updateEvent } from '../../storage/models/event/modelUtils';
import {
  EmailTypes,
  EventAttendee,
  EmailContentType,
  EventSyncState,
  DecryptedEvent,
  EventAttendeeType,
  isUnresolvedAttendee,
  isExternalAttendee,
  UnresolvedAttendee,
  InternalAttendee
} from '../../storage/models/event/types';
import { getEventOwner } from '../../storage/models/event/utils';
import {
  attendeeListToAddresses,
  mergeAttendees,
  organizerValueToMail,
  updateAttendee
} from '../../storage/models/EventAttendee';
import { scheduleCheckUnreadICS } from '../../storage/useSync';
import { setReadingUnreadICS } from '../../storage/useSyncVars';
import { attendeeMatchAnyAlias } from '../attendeeUtils';
import { EmailTemplateGenerator, getRsvpEmailTitle } from '../emailTemplates';
import { isRecurringParent, performOnAllRecurrences } from '../recurringUtils';

import {
  createICSEmailRequests,
  decryptEmail,
  EncryptedEmail,
  fetchAndDecryptAttachments,
  sendEmailWithUpload,
  validateAndAttachCaptchaToken
} from './emailUtils';
import { handleRateLimitError } from './externalMailRateLimitUtils';
import { SendMailResultType, SendStatus } from './types';
export interface SendICSEmailRequest {
  emailType: EmailTypes;
  toAttendees: EventAttendee[];
  emailRequest: SendEmailRequest;
}

async function createEmailContent(emailType: EmailTypes, event: DecryptedEvent, fromAddress: SendAddressRequest) {
  switch (emailType) {
    case EmailTypes.Invite:
      return {
        messageSubject: `${fromAddress?.name || fromAddress.address} invited you to a new event: ${
          event.decryptedContent.title
        }`,
        messageTextBody: 'Invite to Event', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };
    case EmailTypes.Uninvite:
      return {
        messageSubject: `${fromAddress?.name || fromAddress.address} uninvited you from the event: ${
          event.decryptedContent.title
        }`,
        messageTextBody: 'Uninvited from Event', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };
    case EmailTypes.Update:
      return {
        messageSubject: `${fromAddress?.name || fromAddress.address} updated the event: ${
          event.decryptedContent.title
        }`,
        messageTextBody: 'Updated Event', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };
    case EmailTypes.RSVP:
      return {
        messageSubject: getRsvpEmailTitle(event, fromAddress),
        messageTextBody: 'Updated Attendance Status', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };
    case EmailTypes.AliasDeleted:
      return {
        messageSubject: getRsvpEmailTitle(event, fromAddress),
        messageTextBody: 'Updated Attendance Status', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };

    case EmailTypes.GlobalDelete:
      return {
        messageSubject: `${fromAddress?.name || fromAddress.address} has deleted the event`,
        messageTextBody: 'Deleted Event', // TODO create better email content
        messageHtmlBody: await new EmailTemplateGenerator(emailType, event, fromAddress).generate()
      };
  }
}

export function getICSMethod(emailType: EmailTypes) {
  switch (emailType) {
    case EmailTypes.RSVP:
      return ICalCalendarMethod.REPLY;
    case EmailTypes.Uninvite:
      return ICalCalendarMethod.CANCEL;
  }
  return ICalCalendarMethod.REQUEST;
}

export async function createEventEmail(
  emailType: EmailTypes,
  event: DecryptedEvent,
  toAttendees: EventAttendee[],
  userData: models.User,
  decryptionServicePublicKey: { key: string },
  fromAddress: SendAddressRequest
): Promise<SendICSEmailRequest | undefined> {
  const icsEventStatus = event.plainContent.deleted ? ICalEventStatus.CANCELLED : ICalEventStatus.CONFIRMED;
  const icsMethod = getICSMethod(emailType);
  const ics = generateICS(
    DecryptedEventModel.fromDecryptedEvent(event).toGenerateEvent(),
    icsEventStatus,
    icsMethod,
    fromAddress.address
  );
  if (!ics) {
    return undefined;
  }

  const base64EncodedICS = encodeBase64(Buffer.from(ics));
  const { messageHtmlBody, messageTextBody, messageSubject } = await createEmailContent(emailType, event, fromAddress);

  // make sure we have a default alias to send from in case the email type is `AliasDeleted`
  if (emailType === EmailTypes.AliasDeleted && !userData.defaultEmailAlias) {
    throw new Error("Can't send email of type `EmailTypes.AliasDeleted` - no default alias");
  }

  const {
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    encryptedAttachments,
    toAddressesWithEncryptedKeys,
    ccAddressesWithEncryptedKeys,
    bccAddressesWithEncryptedKeys,
    externalEncryptedSessionKey,
    fromAddressWithEncryptedKey
  } = await encryptMessage(
    {
      messageSubject,
      messageTextBody,
      messageHtmlBody,
      attachments: [
        {
          content: base64EncodedICS,
          metadata: {
            checksum: await sha256(ics),
            contentDisposition: 'attachment; filename="invite.ics"',
            contentId: `<${v4()}${EXTERNAL_ID_SUFFIX}>`,
            contentType: `text/calendar; charset="utf-8"; method=${icsMethod}; name="invite.ics"`,
            filename: 'invite.ics',
            size: new Blob([ics]).size
          }
        }
      ],
      toAddresses: attendeeListToAddresses(toAttendees),
      ccAddresses: [],
      bccAddresses: [],
      fromAddress:
        emailType === EmailTypes.AliasDeleted
          ? {
              name: userData.publicData?.displayName || '',
              address: userData.defaultEmailAlias || ''
            }
          : {
              name: fromAddress.name,
              address: fromAddress.address
            },
      privateKey: userData.privateUserData.privateKey,
      publicKey: userData.publicKey,
      externalPublicKey: decryptionServicePublicKey
    },
    client
  );

  const request: SendEmailRequest = {
    from: fromAddressWithEncryptedKey,
    to: toAddressesWithEncryptedKeys,
    cc: ccAddressesWithEncryptedKeys,
    bcc: bccAddressesWithEncryptedKeys,
    attachments: encryptedAttachments,
    encryptedSubject,
    encryptedText,
    encryptedHtml,
    encryptedTextAsHtml,
    externalEncryptedSessionKey,
    rawSubject: messageSubject,
    calendarInvite: true,
    captchaToken: ''
  };

  return {
    emailType,
    toAttendees,
    emailRequest: request
  };
}

export const addUserAttendeeIfNeeded = async (
  event: DecryptedEventModel,
  user: models.User,
  calendarID: string,
  ownAttendeeStatus?: AttendeeStatus
) => {
  const allUserAliases = await client.query<CurrentUserEmailAliasesQuery, CurrentUserEmailAliasesQueryVariables>({
    query: CurrentUserEmailAliasesDocument,
    variables: {}
  });

  const userEmailAliases = allUserAliases.data.currentUser?.emailAliases || [];
  const ourAttendee = event.decryptedContent.attendees.find((a) => attendeeMatchAnyAlias(a, userEmailAliases));
  const doesEventHaveOwner = !!getEventOwner(event);

  const addOurAttendee = () => {
    const existingPermission = ourAttendee?.permission;
    const generatedPermission = doesEventHaveOwner ? AttendeePermission.Read : AttendeePermission.Owner;

    assertExists(user.defaultEmailAlias, 'importIcsFile: User does not have a default email alias.');
    mergeAndSetAttendees(event, [
      {
        type: EventAttendeeType.InternalAttendee,
        publicKey: user.publicKey,
        displayName: user.publicData?.displayName || undefined,
        calendarID,
        id: calendarID,
        email: ourAttendee?.email || user.defaultEmailAlias,
        // If the event has an owner, add our attendee with Read permission, otherwise add our attendee with owner permission
        permission: !doesEventHaveOwner ? AttendeePermission.Owner : existingPermission ?? generatedPermission,
        optional: false,
        attendeeStatus: ownAttendeeStatus || ourAttendee?.attendeeStatus || AttendeeStatus.Pending,
        deleted: false,
        updatedAt: new Date().getTime()
      }
    ]);
  };

  // If the event does have the current user, but they are not internal,
  // Upgrade them to internal so keys are saved properly.
  if (ourAttendee && ourAttendee.type !== EventAttendeeType.InternalAttendee) {
    event.decryptedContent.attendees = event.decryptedContent.attendees.filter(
      (a) => !attendeeMatchAnyAlias(a, userEmailAliases || [])
    );

    addOurAttendee();
  }

  // If the event doesn't have the current user - add them as owner
  if (!ourAttendee) addOurAttendee();
};

/**
 * Will return true when the event has ID that does not match to skiff externalID pattern but the organizer is a skiff user.
 *
 * This case can happen when attendee for external client is responding to recurring event with `This and Future` (which we do not support at the moment).
 * In this cases the event is being sent with different ID but the organizer is still the skiff user.
 */
const isExternalEventWithSkiffOwner = (event: ParsedEvent, userEmailAliases: string[]) => {
  const isSkiffID = skiffIDRegex.test(event.id);
  const isCurrentUserOrganizer = userEmailAliases.includes(organizerValueToMail(event.organizer?.value || ''));

  return !isSkiffID && isCurrentUserOrganizer;
};

// TODO: This is a temporary solution to allow scheduling emails from cal.com
const ALLOWED_SCHEDULING_SENDERS = ['hello@cal.com'];

export const handleICSEvent = async (event: ParsedEvent, from: string, user: models.User, withRecurring = false) => {
  const calendarMeta = await getCurrentCalendarMetadata();
  if (!calendarMeta) throw new Error('handleICSEvent: Calendar metadata not found');

  const currentEvents = await getEventsByExternalID(event.id, true);

  const currentEvent = currentEvents.find(
    (_event) => _event.plainContent.recurrenceDate === (event.recurrenceId?.valueOf() || 0)
  );

  const allUserAliases = await client.query<CurrentUserEmailAliasesQuery, CurrentUserEmailAliasesQueryVariables>({
    query: CurrentUserEmailAliasesDocument,
    variables: {}
  });
  const userEmailAliases = allUserAliases.data.currentUser?.emailAliases || [];

  const isICSFromScheduler = ALLOWED_SCHEDULING_SENDERS.includes(from);

  if (isExternalEventWithSkiffOwner(event, userEmailAliases) && !isICSFromScheduler) {
    // we currently don't support this kind of updates
    return;
  }

  if (currentEvent) {
    // If the user sending the update was the creator, allow them to update any content.
    if (currentEvent.plainContent.externalCreator === from) {
      if (withRecurring && isRecurringParent(currentEvent)) {
        await performOnAllRecurrences(currentEvent.parentEventID, async (_event, singleEvent, isEvent) => {
          await _event.updateRecurrenceWithDraftOrEventContent(
            DecryptedEventModel.fromParsedICSUpdate(event, _event, userEmailAliases, withRecurring),
            singleEvent,
            isEvent
          );
          return _event;
        });
      } else {
        mergeEvents(
          currentEvent,
          DecryptedEventModel.fromParsedICSUpdate(event, currentEvent, userEmailAliases, withRecurring)
        );
        await saveContent(currentEvent);
      }
    } else {
      const organizerMail = organizerValueToMail(event.organizer?.value || '');
      // Only update the attendee list.
      if (withRecurring && isRecurringParent(currentEvent)) {
        await performOnAllRecurrences(currentEvent.parentEventID, (_event) => {
          const newAttendees = event.attendees
            .map((attendee) => updateAttendee(attendee, _event, userEmailAliases, organizerMail === attendee.email))
            .filter(filterExists);
          mergeAndSetAttendees(_event, newAttendees);
          return _event;
        });
      } else {
        const newAttendees = event.attendees
          .map((attendee) => updateAttendee(attendee, currentEvent, userEmailAliases, organizerMail === attendee.email))
          .filter(filterExists);
        mergeAndSetAttendees(currentEvent, newAttendees);
        await saveContent(currentEvent);
      }
    }
  } else {
    // If we reached here, it means we are importing a new event. (no event with the same externalID + recurrenceDate exists)
    // If the event is recurring, we need to check if its parent already exists, and if its add the parentRecurrenceId to it.
    const parentRecurringEvent = currentEvents.length
      ? currentEvents.find((_event) => isRecurringParent(_event))
      : undefined;
    const parentRecurrenceID = parentRecurringEvent?.parentEventID;
    const parentRecurringRule = parentRecurringEvent?.plainContent.recurrenceRule || undefined;

    const newEvents = await DecryptedEventModel.fromParsedICS(
      event,
      calendarMeta.calendarID,
      parentRecurrenceID ? undefined : from,
      parentRecurrenceID,
      parentRecurringRule,
      withRecurring,
      isICSFromScheduler
    );

    const isRSVP = event.method === CalendarMethodTypes.Reply;

    const recurringParent = parentRecurrenceID ? await getEventByID(parentRecurrenceID) : undefined;

    assertExists(user.defaultEmailAlias, 'importIcsFile: User does not have a default email alias.');
    await Promise.all(
      newEvents.map(async (newEvent) => {
        await addUserAttendeeIfNeeded(newEvent, user, calendarMeta.calendarID);

        // If the event is recurring we want to keep all the parent data and use only the updated attendees from the ics
        // If we reached here that means this specific event has no instance and no changes compering to the parent.
        // This means we can use all the parent data while only keeping the updated attendees status.
        let updatedEvent = newEvent;
        if (recurringParent) {
          const recurringParentAttendeesWithoutSessionKeys = recurringParent.decryptedContent.attendees.map(
            (attendee) => {
              if (isUnresolvedAttendee(attendee) || isExternalAttendee(attendee)) return attendee;
              return {
                type: EventAttendeeType.UnresolvedAttendee,
                id: attendee.id,
                attendeeStatus: attendee.attendeeStatus,
                permission: attendee.permission,
                optional: attendee.optional,
                email: attendee.email,
                displayName: attendee.displayName,

                // Fields for conflict resolution
                deleted: attendee.deleted,
                updatedAt: attendee.updatedAt,

                // Fields for mail sending
                isNew: attendee.isNew
              } as UnresolvedAttendee;
            }
          );
          updatedEvent = DecryptedEventModel.fromDecryptedEvent({
            ...newEvent,
            decryptedContent: {
              ...recurringParent.decryptedContent,
              ...(!isRSVP && newEvent.decryptedContent),
              attendees: mergeAttendees(recurringParentAttendeesWithoutSessionKeys, newEvent.decryptedContent.attendees)
                .mergedAttendees
            }
          });
        }
        if (isICSFromScheduler) {
          const isCurrUserGuest = updatedEvent.decryptedContent.attendees.some(
            (attendee) =>
              attendeeMatchAnyAlias(attendee, userEmailAliases) && attendee.permission !== AttendeePermission.Owner
          );
          const isEventOwnerInternal = updatedEvent.decryptedContent.attendees.some(
            (attendee) =>
              attendee.permission === AttendeePermission.Owner && attendee.type === EventAttendeeType.InternalAttendee
          );
          // If ICS event is from a scheduler, ie cal.com, and the current user is a guest on the event
          // and the owner of the event is also an internal Skiff user, do not save the event
          // as the Skiff owner will have saved the event already. This prevents duplicate events from
          // appearing -- one from the parsed ICS and one from the saved internal event from the Skiff owner.
          if (isCurrUserGuest && isEventOwnerInternal) {
            return;
          }
        }

        await saveContent(updatedEvent);
      })
    );
  }
};

export async function checkUnreadICS(withRecurring = false) {
  const metadata = await getCurrentCalendarMetadata();
  const calendarID = metadata?.calendarID;
  assertExists(calendarID, "checkUnreadICS: Calendar metadata doesn't exist");

  const { data: unreadICSQueryData } = await client.query<GetEmailsWithUnreadIcsQuery>({
    query: GetEmailsWithUnreadIcsDocument,
    fetchPolicy: 'no-cache'
  });

  const currentUser = requireCurrentUserData();
  const privateKey = currentUser.privateUserData.privateKey;

  const emails: EncryptedEmail[] = unreadICSQueryData.emailsWithUnreadICS2.emails.map((encryptedEmail) =>
    decryptEmail(encryptedEmail, privateKey)
  );

  if (emails.length === 0) {
    setReadingUnreadICS(false);
    return;
  }

  setReadingUnreadICS(true);

  const attachmentToEmailMap = new Map<string, EncryptedEmail>();

  const emailsWithoutICS: string[] = [];

  // Filter the emails for the relevant Attachment
  const attachmentsToFetch = emails
    .map((email) => {
      const { decryptedAttachments } = email;
      const icsAttachment = decryptedAttachments.find(
        ({ decryptedMetadata }) => decryptedMetadata.contentType === 'text/calendar'
      );
      if (!icsAttachment || icsAttachment.attachmentID === null) {
        emailsWithoutICS.push(email.id);
        return null;
      }
      attachmentToEmailMap.set(icsAttachment.attachmentID, email);
      return icsAttachment.attachmentID;
    })
    .filter(filterExists);

  if (emailsWithoutICS.length > 0)
    await client.mutate<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>({
      mutation: MarkEmailAsReadIcsDocument,
      variables: {
        request: {
          emailIDs: emailsWithoutICS,
          reason: 'No ICS attachment'
        }
      }
    });

  const attachments = await fetchAndDecryptAttachments(attachmentsToFetch, privateKey);

  // If we have more then the response limit, schedule another check
  // We are using a locking system so that the check will run only once at a time
  if (unreadICSQueryData.emailsWithUnreadICS2.hasMore) void scheduleCheckUnreadICS(undefined, withRecurring);

  const successfulEmailIDs: string[] = [];

  for (const [attachmentID, icsContent] of attachments) {
    const sourceEmail = attachmentToEmailMap.get(attachmentID);

    if (!sourceEmail) {
      console.error('Could not find source email for attachment', attachmentID);
      continue;
    }

    const emailFails = await ErrorHandlerMetadataDB.get(sourceEmail.id);

    try {
      const parsedEvent = parseICS(icsContent);
      const events = parsedEvent.events;

      await Promise.all(
        events.map((event) => {
          return handleICSEvent(event, sourceEmail.from, currentUser, withRecurring);
        })
      );

      successfulEmailIDs.push(sourceEmail.id);
    } catch (error) {
      console.error('Error while processing ICS email', error);
      const message = (error as { toString: () => string }).toString();
      if (emailFails) {
        await emailFails.addNewError(message);
        // If an ICS email fails 3 or more times, don't try and re-process it again.
        if (emailFails.count >= 3) {
          await client.mutate<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>({
            mutation: MarkEmailAsReadIcsDocument,
            variables: {
              request: {
                emailIDs: [sourceEmail.id]
              }
            }
          });
        }
      } else {
        await ErrorHandlerMetadataDB.create({
          emailID: sourceEmail.id,
          message: [message],
          calendarID
        });
      }
    }
  }

  setReadingUnreadICS(!!unreadICSQueryData.emailsWithUnreadICS2.hasMore);

  if (successfulEmailIDs.length > 0)
    await client.mutate<MarkEmailAsReadIcsMutation, MarkEmailAsReadIcsMutationVariables>({
      mutation: MarkEmailAsReadIcsDocument,
      variables: {
        request: {
          emailIDs: successfulEmailIDs,
          reason: 'Successfully processed'
        }
      }
    });
}

/**
 * will return false if:
 * - no event
 * - users chose to send mail to external attendees only, and theres no external attendees
 * @param event
 * @param externalOnly
 * @returns
 */
export const shouldSendMail = (event: DecryptedEventModel | undefined, externalOnly = false) => {
  if (!event) {
    console.error('shouldSendMail: Could not find event!');
    return false;
  }

  // If the mail is for external only + the event does not have external attendees do not mark as need to send
  const hasExternalAttendee = event.decryptedContent.attendees.find(
    (att) => att.type === EventAttendeeType.ExternalAttendee
  );
  if (externalOnly && !hasExternalAttendee) {
    console.log('Event has no external attendees, not sending mail');
    return false;
  }

  return true;
};

/**
 * Query event with eventID and mark it as need to be send mail
 * The next time sendICSEmails runs it will query all events that need to send mail and send them
 */
export const markEventAsNeedToSendContentMail = async (eventId: string | undefined, externalOnly = false) => {
  if (!eventId) return;

  const metadata = await getCurrentCalendarMetadata();
  const calendarID = metadata?.calendarID;
  assertExists(calendarID, 'markEventAsNeedToSendContentMail: Cannot get calendarID');

  const event = await getEventByID(eventId, true); // Query the event even if it has been deleted

  if (!shouldSendMail(event, externalOnly) || !event) return;

  event.markAsNeedToSendMail(calendarID, [externalOnly ? EmailContentType.ContentExternal : EmailContentType.Content]);
  await updateEvent(event.parentEventID, event.localMetadata);
};

// Function that gets array of events, generate ics and sends update emails if needed
export const sendEmailsForEventUpdates = async (
  eventsWithLocalChanges: DecryptedEventModel[],
  calendarID: string,
  userData: models.User
): Promise<SendMailResultType> => {
  const eventsWithAttendees = eventsWithLocalChanges.filter(
    (event) => event.decryptedContent.attendees && event.decryptedContent.attendees.length > 1
  );

  // if no events with attendees we can return `undefined` and make all the events be marked as sent
  if (!eventsWithAttendees.length) return;

  let decryptionServicePublicKeyRes: ApolloQueryResult<DecryptionServicePublicKeyQuery> | undefined;
  // if this query fails (no network for example), and we don't catch it,
  // we will mark all mails as sent.
  // so we catch this errors and return response that will make sure the mails won't be marked as sent
  try {
    decryptionServicePublicKeyRes = await client.query<DecryptionServicePublicKeyQuery>({
      query: DecryptionServicePublicKeyDocument
    });
  } catch (err) {
    // if the query failed we want to try and send the mails again once it will succeed
    return eventsWithLocalChanges.map((eventToSend) => ({
      event: eventToSend,
      attendeesToUpdate: [],
      emailTypesSent: [],
      status: SendStatus.Retry
    }));
  }

  const decryptionServicePublicKey = decryptionServicePublicKeyRes?.data.decryptionServicePublicKey;
  // if no decryptionServicePublicKey we can return `undefined` and make all the event be marked as sent
  if (!decryptionServicePublicKey) return;

  return Promise.all(
    eventsWithAttendees.map(async (eventWithAttendees) => {
      try {
        const [internalAttendees] = partition<EventAttendee, InternalAttendee>(
          eventWithAttendees.decryptedContent.attendees,
          (attendee): attendee is InternalAttendee => attendee.type === EventAttendeeType.InternalAttendee
        );

        // Get event owner
        const eventOwner = getEventOwner(eventWithAttendees);
        assertExists(eventOwner, 'sendEmailsForEventUpdates: Could not find event owner');

        // Email the attendees excluding the current user
        const attendeesExceptCurrentUser = eventWithAttendees.decryptedContent.attendees.filter(
          (attendee) => attendee.id !== calendarID
        );

        // Send the email as the current user
        const thisAttendee = internalAttendees.find((attendee) => attendee.id === calendarID);

        // Check if this attendee is a writer
        const isThisAttendeeWriter =
          thisAttendee?.permission === AttendeePermission.Owner || thisAttendee?.permission === AttendeePermission.Write
            ? true
            : false;

        // Send emails only if there are attendees (other than the current user) in the event
        if (
          attendeesExceptCurrentUser.length > 0 &&
          eventWithAttendees.localMetadata.syncState === EventSyncState.Done &&
          thisAttendee
        ) {
          const fromAddress = attendeeListToAddresses([thisAttendee])[0];
          let toAttendees: EventAttendee[] = [];
          // Figure out who to send emails to based on the ownership of the event.
          if (isThisAttendeeWriter) {
            // If event content update then send emails to all
            toAttendees = attendeesExceptCurrentUser;
          } else {
            // Otherwise, the attendee must send the update only to the owner/writer of the event and not other attendees.
            toAttendees = [eventOwner];
          }

          // GlobalDelete - when the creator deletes an event
          const isGlobalDelete = !!(
            eventWithAttendees.plainContent.deleted &&
            thisAttendee?.calendarID === eventWithAttendees.plainContent.creatorCalendarID
          );

          // Create invite, update, global delete email requests
          // requests that already been sent and saved in the event local metadata won't be created again
          const requests = await createICSEmailRequests(
            isGlobalDelete,
            eventWithAttendees,
            toAttendees,
            userData,
            decryptionServicePublicKey,
            fromAddress
          );

          if (!some(requests)) {
            console.error('Failed creating email for external invites', eventWithAttendees);
            // If we did not create requests for the mail, that is a sign of a corrupt event
            // we want to un-mark it as need to send so it will not try to send again
            return {
              event: eventWithAttendees,
              attendeesToUpdate: [],
              emailTypesSent: [],
              status: SendStatus.Fail
            };
          }

          const requestsWithToken = await validateAndAttachCaptchaToken(requests);

          const attendeesToUpdate: EventAttendee[] = []; // Attendees to update "isNew" to false
          const emailTypesSent: EmailTypes[] = [];
          let failedCount = 0;

          // Send all requests
          await Promise.all(
            requestsWithToken.map(async (request) => {
              try {
                // Try send email
                console.log(
                  `Sending [${request.emailType}] email to ${request.toAttendees.map((a) => a.email).join(', ')}`
                );
                const sendEmailResponse = await sendEmailWithUpload(request.emailRequest);
                if (sendEmailResponse.errors?.length && sendEmailResponse.errors.length > 0) {
                  handleRateLimitError([...sendEmailResponse.errors], calendarID);
                  throw Error(sendEmailResponse.errors.map((error) => error.message).join());
                }

                // If the email was sent successfully add it to email types sent
                emailTypesSent.push(request.emailType);

                // If invite mails were sent successfully add them to attendees to update to set attendee "isNew" to false
                // to make sure the next email they will gat is `update`
                if (request.emailType === EmailTypes.Invite || request.emailType === EmailTypes.Uninvite) {
                  attendeesToUpdate.push(...request.toAttendees);
                }
              } catch (error) {
                console.error('Failed to send email', error);
                failedCount++;
              }
            })
          );

          return {
            event: eventWithAttendees,
            attendeesToUpdate,
            emailTypesSent,
            // if one or more sending failed we don't want to mark the event as sent to try to send this type again.
            // we keep track on the sent email type to make we don't send the same email more than once
            status: failedCount > 0 ? SendStatus.Retry : SendStatus.Success
          };
        }
      } catch (error) {
        console.error('Failed creating email for external invites', eventWithAttendees, error);
        // If we did not create requests for the mail, that is a sign of a corrupt event
        // we want to un-mark it as need to send so it will not try to send again
        return {
          event: eventWithAttendees,
          attendeesToUpdate: [],
          emailTypesSent: [],
          status: SendStatus.Fail
        };
      }
    })
  );
};
