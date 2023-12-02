import { generatePublicPrivateKeyPair } from 'skiff-crypto';
import { AttendeePermission } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import {
  parsedEventWithExternalOrganizer,
  parsedEventWithoutOrganizer,
  parsedEventWithoutOrganizerInAttendees
} from '../../../tests/mocks/parsedEventsMocks';
import { generateMockUser, generateCurrentUserEmailAliasesResponse } from '../../../tests/mocks/user';
import { mswServer, usersFromEmailAliasHandlerFactory, currentUserAliasesFactory } from '../../../tests/mockServer';
import { DecryptedEventModel } from '../../storage/models/event/DecryptedEventModel';
import { putEventWithMerge, saveContent } from '../../storage/models/event/modelUtils';
import { EventAttendeeType } from '../../storage/models/event/types';
import { getEventOwner } from '../../storage/models/event/utils';
import { organizerValueToMail } from '../../storage/models/EventAttendee';

import { addUserAttendeeIfNeeded } from './icsUtils';

const calendarID = 'calendarID';
const internalUserKeypair = generatePublicPrivateKeyPair();
const internalUserObject = generateMockUser(internalUserKeypair, 'internalUser', calendarID);

const mockSave = jest.fn<typeof putEventWithMerge, [DecryptedEventModel]>();

jest.mock('../../storage/models/event/mergeUtils', () => {
  return {
    updateConflictMarkers: () => {
      return { contentLastUpdateKeyMap: {}, preferencesLastUpdateKeyMap: {} };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    mergeAndSetAttendees: jest.requireActual('../../storage/models/event/mergeUtils').mergeAndSetAttendees
  };
});

jest.mock('../../storage/models/event/modelUtils', () => {
  return {
    putEventWithMerge: (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockSave(event);
      return Promise.resolve([]);
    },
    getEventByID: () => {
      return Promise.resolve(undefined);
    },
    saveContent: (event) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      mockSave(event);
    }
  };
});

describe('addUserAttendeeIfNeeded test', () => {
  beforeAll(() => {
    mswServer.use(
      usersFromEmailAliasHandlerFactory({
        usersFromEmailAlias: []
      })
    );
    mswServer.use(currentUserAliasesFactory(generateCurrentUserEmailAliasesResponse(internalUserObject)));
  });

  it('can create event from parsed event with organizer', async () => {
    const events = await DecryptedEventModel.fromParsedICS(parsedEventWithExternalOrganizer, calendarID);
    const event = events[0];
    await addUserAttendeeIfNeeded(event, internalUserObject, calendarID);
    await saveContent(event);

    const savedEvent = mockSave.mock.calls[0][0];
    assertExists(savedEvent);

    const ourAttendee = savedEvent.decryptedContent.attendees.find(
      (att) => att.email === internalUserObject.recoveryEmail
    );
    const eventOwner = getEventOwner(event);

    assertExists(ourAttendee);
    assertExists(eventOwner);

    // Our attendee should not be event owner
    expect(eventOwner.email).not.toBe(ourAttendee.email);
    // Event owner should be organizer
    assertExists(parsedEventWithExternalOrganizer.organizer);
    assertExists(parsedEventWithExternalOrganizer.organizer.value);
    expect(eventOwner.email).toBe(organizerValueToMail(parsedEventWithExternalOrganizer.organizer.value));
  });
  it('can create event from parsed event without organizer', async () => {
    const events = await DecryptedEventModel.fromParsedICS(parsedEventWithoutOrganizer, calendarID);
    const event = events[0];

    await addUserAttendeeIfNeeded(event, internalUserObject, calendarID);
    await saveContent(event);

    const savedEvent = mockSave.mock.calls[0][0];
    assertExists(savedEvent);
    const ourAttendee = savedEvent.decryptedContent.attendees.find(
      (att) => att.email === internalUserObject.recoveryEmail
    );
    const eventOwner = getEventOwner(event);
    assertExists(ourAttendee);
    assertExists(eventOwner);

    // Our attendee should be event owner
    expect(eventOwner.email).toBe(ourAttendee.email);

    // External attendee should only have read permission
    const externalAttendee = event.decryptedContent.attendees.find(
      (att) => att.type === EventAttendeeType.ExternalAttendee
    );
    assertExists(externalAttendee);
    expect(externalAttendee.permission).toBe(AttendeePermission.Read);
  });
  it('can create event from parsed event without organizer in attendees', async () => {
    const events = await DecryptedEventModel.fromParsedICS(parsedEventWithoutOrganizerInAttendees, calendarID);
    const event = events[0];
    // organizer should have been added to attendees
    expect(event.decryptedContent.attendees.length).toBe(2);
    // organizer should be owner
    const eventOwner = getEventOwner(event);
    assertExists(eventOwner);
    assertExists(parsedEventWithoutOrganizerInAttendees.organizer);
    assertExists(parsedEventWithoutOrganizerInAttendees.organizer.value);
    expect(eventOwner?.email).toBe(organizerValueToMail(parsedEventWithoutOrganizerInAttendees.organizer.value));
  });
});
