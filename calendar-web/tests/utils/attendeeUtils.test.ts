import { AttendeePermission } from 'skiff-graphql';

import { attendeeListToAddresses } from '../../src/storage/models/EventAttendee';
import { createRandomInternalAttendee } from '../fixture/event';
import { plainMockEvent } from '../mocks/encryptedEvent';

describe('test attendeeListToAddresses', () => {
  it('toAddresses must match', () => {
    const event = plainMockEvent({});
    event.decryptedContent.attendees = [
      createRandomInternalAttendee(AttendeePermission.Read, 'testEvent1publicKey1', 'testEvent1Attendee1'),
      createRandomInternalAttendee(AttendeePermission.Read, 'testEvent1publicKey2', 'testEvent1Attendee2')
    ];
    const actualToAddresses = event.decryptedContent.attendees.map((attendee) => ({
      name: attendee.displayName,
      address: attendee.email
    }));
    const expectedToAddresses = attendeeListToAddresses(event.decryptedContent.attendees);
    expect(expectedToAddresses).toEqual(actualToAddresses);
  });
  it('toAddresses must not match', () => {
    const event = plainMockEvent({});
    event.decryptedContent.attendees = [
      createRandomInternalAttendee(AttendeePermission.Read, 'testEvent1publicKey1', 'testEvent1Attendee1'),
      createRandomInternalAttendee(AttendeePermission.Read, 'testEvent1publicKey2', 'testEvent1Attendee2')
    ];
    const actualToAddresses = event.decryptedContent.attendees.map((attendee) => ({
      name: attendee.displayName,
      address: attendee.email
    }));

    event.decryptedContent.attendees[0].email = 'newEmailAlias@random.com';
    const expectedToAddresses = attendeeListToAddresses(event.decryptedContent.attendees);
    expect(expectedToAddresses).not.toEqual(actualToAddresses);
  });
});
