import { isAndroid } from 'react-device-detect';
import { sendRNWebviewMsg } from 'skiff-front-utils';
import { EventUpdateType } from 'skiff-graphql';

import { doesEventExistForAttendee } from '../storage/models/event/modelUtils';
import { DecryptedEvent, EventAttendee } from '../storage/models/event/types';

import { isRecurringEvent } from './recurringUtils';

// TODO SHARE TYPES
enum MobileAppEventTypes {
  LocalNotificationUpdate = 'localNotificationUpdate'
}

enum NotificationType {
  EncryptedEventUpdate = 'encryptedEventUpdate',
  EventUpdate = 'eventUpdate'
}

export interface WebviewEventUpdate {
  parentEventID: string;
  endDate: Date;
  startDate: Date;
  deleted: boolean;
  title: string;
  description: string;
  color?: string;
  location: string;
  attendees: EventAttendee[];
  decryptedSessionKey: string;
  externalCreator: string | null;
  updateType: EventUpdateType[];
  parentRecurrenceID?: string;
  recurrenceDate: number;
  isRecurring: boolean;
  isAllDay?: boolean;
  conferenceLink?: string;
}

export function updateLocalNotifications(updates: WebviewEventUpdate[]) {
  sendRNWebviewMsg(MobileAppEventTypes.LocalNotificationUpdate, {
    type: NotificationType.EventUpdate,
    payload: updates
  });
}

export const createWebviewEventUpdate =
  (calendarID: string) =>
  (event: DecryptedEvent): WebviewEventUpdate => {
    return {
      parentEventID: event.parentEventID,
      startDate: new Date(event.plainContent.startDate),
      endDate: new Date(event.plainContent.endDate),
      deleted: !doesEventExistForAttendee(event, calendarID), // Checks also for events that are "deleted for me"
      title: event.decryptedContent.title.trim() || 'Untitled',
      description: event.decryptedContent.description?.trim() || 'No Description',
      color: event.decryptedPreferences?.color || 'blue',
      location: event.decryptedContent.location || '',
      attendees: event.decryptedContent.attendees || [],
      decryptedSessionKey: event.decryptedSessionKey,
      externalCreator: event.plainContent.externalCreator,
      updateType: event.localMetadata.updateType,
      parentRecurrenceID: event.plainContent.parentRecurrenceID || undefined,
      recurrenceDate: event.plainContent.recurrenceDate,
      isRecurring: isRecurringEvent(event),
      isAllDay: event.decryptedContent.isAllDay,
      conferenceLink: event.decryptedContent.conference?.link
    };
  };

/**
 * IOS and Android have a limited amount of local notifications that we can schedule
 * So we want to reduce the amount of events we send. Deleted events do not add notifications
 * instead we send them to unschedule the notifications. So in order to always send the max amount of notifications
 * we can schedule, each non-deleted event that is added increments our count and once we reach the native limit
 * we only push deleted events
 */
export function sliceEvents(events: DecryptedEvent[]) {
  const limit = isAndroid ? 50 : 64; // Amount of notification native notification queue can handle
  const eventsToSendToWebview: DecryptedEvent[] = [];
  let count = 0;
  events.forEach((event) => {
    if (event.plainContent.deleted) {
      // If the event is deleted, we can always send to webview, because it will only unschedule the notification
      eventsToSendToWebview.push(event);
    } else {
      // If the event is not deleted we need to check that we haven't reached native limit
      if (count < limit) {
        eventsToSendToWebview.push(event);
        count++;
      }
    }
  });
  return eventsToSendToWebview;
}
