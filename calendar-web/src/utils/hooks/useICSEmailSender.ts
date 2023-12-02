import SuperTokensLock from 'browser-tabs-lock';
import { useEffect } from 'react';
import { requireCurrentUserData } from 'skiff-front-utils';
import { filterExists } from 'skiff-utils';

import { getCurrentCalendarID } from '../../apollo/currentCalendarMetadata';
import {
  getEventByID,
  getEventsThatShouldSendMail,
  saveContent,
  updateEvent
} from '../../storage/models/event/modelUtils';
import { EventAttendeeType, EventSyncState } from '../../storage/models/event/types';
import { isThrottled, reachedRateLimit } from '../sync/externalMailRateLimitUtils';
import { sendEmailsForEventUpdates } from '../sync/icsUtils';
import { SendMailResultType, SendStatus } from '../sync/types';

const SEND_ICS_INTERVAL = 3000;

export const sendICSEmails = async () => {
  // we're not asserting the calendarID because sendICSEmails can run before the reactive var has been initialized
  const calendarID = getCurrentCalendarID();
  if (!calendarID) {
    console.warn('sendICSEmails: calendarID is not defined');
    return;
  }

  const userData = requireCurrentUserData();

  // Query all events that need to send email
  // Events that need to send mail are all the events which their currentMailTimestamp is smaller than their requestMailTimestamp

  let eventsToSend = await getEventsThatShouldSendMail();

  // As initial bullet proofing, do not try to send mail again if we reached rate limit
  if (reachedRateLimit(calendarID)) {
    console.warn('Reached rate limit, not sending mail for events');
    if (isThrottled(calendarID)) return;
    // Filter out events with external attendees if we reached rate limit
    eventsToSend = eventsToSend.filter((event) => {
      const hasExternalAttendee = event.decryptedContent.attendees.find(
        (attendee) => attendee.type === EventAttendeeType.ExternalAttendee
      );
      return !hasExternalAttendee;
    });
  }

  if (eventsToSend.length === 0) return;

  let sentEvents: SendMailResultType;

  // make sure failures in `sendEmailsForEventUpdates` won't prevent the unmarking as sent emails
  try {
    sentEvents = await sendEmailsForEventUpdates(eventsToSend, calendarID, userData);
  } catch (err) {
    console.error('sendICSEmails: failed sending emails for updated', err);
  }

  // events counted as failed if they fullfil all:
  // 1. don't have response from the send function, or has `SendStatus.Fail` status
  // 2. has sync state - EventSyncState.Done - we don't want to mark events that might have been updated while sending
  //
  // failed event don't have to explicitly fail in the sending, they counted as failed also if they don't have attendees to send the mail to
  const failedEvents = eventsToSend.filter((eventToSend) => {
    const eventSendResult = sentEvents?.find((event) => event?.event.parentEventID === eventToSend.parentEventID);
    return (
      (!eventSendResult || eventSendResult.status === SendStatus.Fail) &&
      eventToSend.localMetadata.syncState === EventSyncState.Done
    );
  });

  // Log events that failed to send mail, and unmark them as needing to send mail
  if (failedEvents.length > 0) {
    console.warn('Failed to send mail for events', failedEvents);
    await Promise.allSettled(
      failedEvents.map(async (event) => {
        event.clearEventMails();
        event.updateMailTimestamp(event.localMetadata.requestMailTimestamp);
        await updateEvent(event.parentEventID, event.localMetadata);
      })
    );
  }

  if (!sentEvents?.filter(filterExists).length) return;

  await Promise.all(
    sentEvents.map(async (eventWithAttendeesToUpdate) => {
      if (!eventWithAttendeesToUpdate) return;
      const { event, attendeesToUpdate, emailTypesSent, status } = eventWithAttendeesToUpdate;
      // Get event from db
      const currentEvent = await getEventByID(event.parentEventID, true);
      if (!currentEvent) return;

      // If the event hadn't changed since we queried events that should send mail requestMailTimestamp should be the same
      const eventIsLatest =
        currentEvent.localMetadata.requestMailTimestamp === event.localMetadata.requestMailTimestamp;

      // If the status is `SendStatus.Success`, mark the mails as sent
      // failed events we're already marked before to prevent another re-tries
      if (status == SendStatus.Success) {
        if (eventIsLatest) {
          // If the event is latest event clear event queue + sent
          currentEvent.clearEventMails();
        }

        // Update event mail timestamp
        // If the event is changed while we are in the process of sending a mail
        // currentMailTimestamp will be smaller than requestMailTimestamp and therefore
        // the event will be queried again in the next interval
        // If the event is not changed then currentMailTimestamp will be the same as requestMailTimestamp
        // and will not be queried again in the next interval
        currentEvent.updateMailTimestamp(event.localMetadata.requestMailTimestamp);
      } else {
        // If the event is latest add emailTypesSent to event
        if (eventIsLatest) {
          // add the sent email types to the event local metadata to make sure it won't be send again
          currentEvent.markSentEmailTypes(emailTypesSent);
        }

        console.warn('sendICSEmails: failed to send one or more emails for event', event.parentEventID, {
          event,
          sentEmailsTypes: emailTypesSent
        });
      }

      // Update "isNew" for all attendees that got invite sent
      attendeesToUpdate.forEach((attendee) => {
        currentEvent.localUpdateAttendee(attendee.id, { isNew: false });
      });

      return saveContent(currentEvent, false, event.localMetadata.syncState);
    })
  );
};

const EMAIL_SEND_LOCK_NAME = 'send_ics_emails';
const superTokensLock = new SuperTokensLock();

export const scheduleEmailSender = async (steal?: boolean) => {
  if (steal) {
    await superTokensLock.releaseLock(EMAIL_SEND_LOCK_NAME);
  }

  const lock = await superTokensLock.acquireLock(EMAIL_SEND_LOCK_NAME, 100);
  if (!lock) return;
  try {
    await sendICSEmails();
  } catch (err) {
    console.error('Encountered error trying to send ics emails', err);
  }

  await superTokensLock.releaseLock(EMAIL_SEND_LOCK_NAME);
};

export default function useICSEmailSender() {
  useEffect(() => {
    const interval = setInterval(() => void scheduleEmailSender(), SEND_ICS_INTERVAL);
    // Steal = true in case of any deadlocks
    void scheduleEmailSender(true);
    return () => {
      clearInterval(interval);
    };
  }, []);
}
