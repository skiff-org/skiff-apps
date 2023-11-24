import { generatePublicPrivateKeyPair } from 'skiff-crypto';
import { EMPTY_DOCUMENT_DATA } from 'skiff-front-graphql';
import { AttendeePermission } from 'skiff-graphql';
import { v4 } from 'uuid';

import { createRandomExternalAttendee, createRandomInternalAttendee } from '../../../tests/fixture/event';
import { plainMockEvent } from '../../../tests/mocks/encryptedEvent';
import { EmailTypes, EventAttendee } from '../../storage/models/event/types';

import { createEventEmail } from './icsUtils';

const mockQuery = jest.fn();
jest.mock('../../../src/apollo/client', () => {
  return {
    query: () => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return mockQuery();
    }
  };
});

describe('test createEventEmail', () => {
  jest.useFakeTimers().setSystemTime(new Date('2021-01-01'));
  it('should create email', async () => {
    const ownerKeypair = generatePublicPrivateKeyPair();
    const owner = createRandomInternalAttendee(AttendeePermission.Owner, ownerKeypair.publicKey, 'ehsan');
    const attendees: EventAttendee[] = [owner, createRandomExternalAttendee(AttendeePermission.Owner, 'sunny')];
    mockQuery.mockImplementation(() => {
      return {
        data: {
          usersFromEmailAliasWithCatchall: [
            {
              publicKey: { key: ownerKeypair.publicKey }
            }
          ]
        }
      };
    });

    const event = plainMockEvent({});
    event.decryptedContent.attendees = [owner];
    const decryptionServicePublicKey = generatePublicPrivateKeyPair().publicKey;
    const fromAddress = {
      name: owner.displayName,
      address: owner.email
    };
    const toAttendees = attendees.filter((attendee) => attendee !== owner);
    const email = await createEventEmail(
      EmailTypes.Invite,
      event,
      toAttendees,
      {
        username: '',
        defaultEmailAlias: owner.email,
        publicKey: { key: ownerKeypair.publicKey, signature: '' },
        privateUserData: {
          privateKey: ownerKeypair.privateKey,
          signingPrivateKey: ownerKeypair.signingPrivateKey,
          documentKey: ''
        },
        userID: v4(),
        signingPublicKey: ownerKeypair.signingPublicKey,
        passwordDerivedSecret: '',
        rootOrgID: '',
        privateDocumentData: EMPTY_DOCUMENT_DATA
      },
      { key: decryptionServicePublicKey },
      fromAddress
    );
    expect(email).not.toBeNull();
  });
});
