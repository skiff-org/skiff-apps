import dayjs from 'dayjs';
import { generateSymmetricKey } from 'skiff-crypto';
import { AttendeePermission, AttendeeStatus } from 'skiff-graphql';
import { v4 } from 'uuid';

import { DEFAULT_EVENT_COLOR, EXTERNAL_ID_SUFFIX } from '../../src/constants';
import { DecryptedEventModel } from '../../src/storage/models/event/DecryptedEventModel';
import {
  DecryptedEvent,
  EventAttendee,
  EventAttendeeType,
  EventLocalMetadata,
  EventSyncState,
  UpdateEventArgs
} from '../../src/storage/models/event/types';

export const encryptedEvent1 = (
  parentEventID: string,
  updatedAt: number,
  startDate: number,
  endDate: number,
  calendarID: string
) => ({
  creatorCalendarID: calendarID,
  calendarEventID: '93379bb9-1414-4c71-a875-83030dac7206',
  parentEventID,
  externalID: `${parentEventID}${EXTERNAL_ID_SUFFIX}`,
  startDate,
  endDate,
  updatedAt,
  encryptedContent: '{}',
  encryptedSessionKey:
    'mqph8SCviHtC2RZ59V43nKdospftBpNzFB7Y9XmeFp/qIrv5u3PzUkpwVMmmgZQ8vxpdvr8tPDkna+yYZBAH3Uk0clNZPtSAKcK9HmXz5vQK0lp5',
  encryptedByKey: 'Jrp82CeTfc+BD8QONtX5OePmNd/P2ETXXVA9jupP1kI=',
  internalAttendeeList: [
    {
      permission: AttendeePermission.Owner,
      status: AttendeeStatus.Yes,
      calendarID,
      username: 'guy353bot21',
      email: 'guy353bot21@skiff.town',
      optional: false,
      updatedAt: 1667980772184,
      deleted: false,
      encryptedSessionKey:
        'mqph8SCviHtC2RZ59V43nKdospftBpNzFB7Y9XmeFp/qIrv5u3PzUkpwVMmmgZQ8vxpdvr8tPDkna+yYZBAH3Uk0clNZPtSAKcK9HmXz5vQK0lp5',
      encryptedByKey: 'Jrp82CeTfc+BD8QONtX5OePmNd/P2ETXXVA9jupP1kI='
    }
  ],
  deleted: false,
  sequence: 0
});

export const plainMockEvent = (
  options: UpdateEventArgs & { localMetadata?: Partial<EventLocalMetadata>; parentEventID?: string },
  defaultAttendeeOptions?: Partial<EventAttendee>
): DecryptedEvent => {
  const randomParentEventID = v4();
  return DecryptedEventModel.fromDecryptedEvent({
    localMetadata: {
      currentMailTimestamp: 1668007561771,
      requestMailTimestamp: 1668007561771,
      eventEmails: { sent: [], queue: [] },
      syncState: EventSyncState.Waiting,
      updatedAt: dayjs().valueOf(),
      updateType: [],
      ...options.localMetadata
    },
    plainContent: {
      lastUpdateKeyMap: {},
      creatorCalendarID: '891b0268-cd69-4124-b704-f71fc32ee01d',
      externalCreator: null,
      startDate: Date.now(),
      endDate: options.plainContent?.startDate
        ? dayjs(options.plainContent.startDate).add(1, 'hour').valueOf()
        : Date.now(),
      recurrenceDate: 0,
      sequence: 0,
      reminders: [],
      ...options.plainContent
    },
    decryptedContent: {
      lastUpdateKeyMap: {},
      title: 'test',
      ...options.decryptedContent,
      attendees: [
        {
          attendeeStatus: AttendeeStatus.Yes,
          calendarID: '891b0268-cd69-4124-b704-f71fc32ee01d',
          deleted: false,
          email: 'guy353bot21@skiff.town',
          id: '891b0268-cd69-4124-b704-f71fc32ee01d',
          optional: false,
          permission: AttendeePermission.Owner,
          publicKey: {
            key: 'Jrp82CeTfc+BD8QONtX5OePmNd/P2ETXXVA9jupP1kI=',
            signature: 'QW9mrUNBUEO8vo0/LI8NBHo7YsAcSlLQL5jZXzLa5pp13L0wj25cqArFFLqbp9NXsacmXE2eQz5jWNs0gPIsDg=='
          },
          type: EventAttendeeType.InternalAttendee,
          updatedAt: 1668007561771,
          displayName: 'guy353bot21',
          ...(defaultAttendeeOptions || {})
        } as EventAttendee,
        ...(options.decryptedContent?.attendees || [])
      ]
    },
    decryptedPreferences: {
      lastUpdateKeyMap: {},
      color: DEFAULT_EVENT_COLOR,
      ...options.decryptedPreferences
    },
    externalID: `${options.parentEventID ? options.parentEventID : randomParentEventID}${EXTERNAL_ID_SUFFIX}`,
    decryptedSessionKey: generateSymmetricKey(),
    parentEventID: options.parentEventID || randomParentEventID
  });
};

export const plainMockEventWithAttendees = (
  options: UpdateEventArgs & { localMetadata?: Partial<EventLocalMetadata>; parentEventID?: string }
): DecryptedEvent =>
  plainMockEvent({
    ...options,
    decryptedContent: {
      ...options.decryptedContent,
      attendees: [
        {
          attendeeStatus: AttendeeStatus.Pending,
          //   calendarID: '96600c17-419e-45ed-80ea-1eb8b144deb7',
          type: EventAttendeeType.UnresolvedAttendee,
          deleted: false,
          email: 'guy353bot20@skiff.town',
          id: '96600c17-419e-45ed-80ea-1eb8b144deb7',
          optional: false,
          permission: AttendeePermission.Read,
          //   publicKey: {
          //     key: 'mHZvf67JoImVJbpxXVHgQ6jDg0cD1Er9u9VTRb3MpxA=',
          //     signature: '8I5BKWuz2lcO+N9C9bbLeNkKbmA7Ot1BLlXzriO8Erud6+EDxyloVIFeWdzNaHbF5ho35XjiC/GJOlRp3qoaCQ=='
          //   },
          updatedAt: 1668007640466,
          displayName: 'guy353bot20@skiff.town',
          isNew: true
        }
      ]
    }
  });
