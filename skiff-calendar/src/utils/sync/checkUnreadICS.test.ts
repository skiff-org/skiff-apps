import { GraphQLRequest } from 'msw';
import { Exact, MarkEmailAsReadIcsRequest } from 'skiff-graphql';

import {
  decryptedEmailResponse,
  mockIcsContent,
  markEmailAsReadIcsResponse,
  unreadICSResponse
} from '../../../tests/mocks/unreadICSResponse';
import { generateCurrentUserEmailAliasesResponse, mockUser1 } from '../../../tests/mocks/user';
import {
  currentUserAliasesFactory,
  getEmailsWithUnreadIcsHandlerFactory,
  markEmailAsReadIcsHandlerFactory,
  mswServer,
  usersFromEmailAliasHandlerFactory
} from '../../../tests/mockServer';
import { initializeTestDB } from '../../../tests/utils/db';
import { getEventsByExternalID } from '../../storage/models/event/modelUtils';
import { EventSyncState } from '../../storage/models/event/types';

import { AttachmentContentTuple } from './emailUtils';
import { checkUnreadICS } from './icsUtils';

jest.mock('skiff-front-utils', () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const original = jest.requireActual('skiff-front-utils');
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return {
    ...original,
    getCurrentUserData: () => mockUser1,
    requireCurrentUserData: () => mockUser1
  };
});

jest.mock('./emailUtils', () => ({
  decryptEmail: (encryptedEmail: { id: string }) => {
    return decryptedEmailResponse[encryptedEmail.id];
  },
  fetchAndDecryptAttachments: (ids: string[]): AttachmentContentTuple[] => {
    expect(ids).toEqual(['attachment_2']);
    return [['attachment_2', mockIcsContent]];
  }
}));

const markAsUnreadIcsMock = jest.fn(
  (
    req: GraphQLRequest<
      Exact<{
        request: MarkEmailAsReadIcsRequest;
      }>
    >
  ) => {
    expect(req.variables.request.emailIDs).toEqual(['d8e6017f-474d-47b7-bf4c-fae43887d8e4']);
  }
);

describe('test checkUnreadICS util', () => {
  beforeEach(async () => {
    await initializeTestDB(
      mockUser1.privateUserData.privateKey,
      mockUser1.publicKey.key,
      mockUser1.primaryCalendar!.calendarID
    );
  });

  it('Get new message', async () => {
    mswServer.use(getEmailsWithUnreadIcsHandlerFactory(unreadICSResponse));
    mswServer.use(markEmailAsReadIcsHandlerFactory(markEmailAsReadIcsResponse, markAsUnreadIcsMock));
    mswServer.use(
      usersFromEmailAliasHandlerFactory({
        usersFromEmailAlias: []
      })
    );
    mswServer.use(currentUserAliasesFactory(generateCurrentUserEmailAliasesResponse(mockUser1)));

    await checkUnreadICS();

    expect(markAsUnreadIcsMock).toBeCalledTimes(1);

    const icsEvents = await getEventsByExternalID('65qq3t0ji5u0bl8q37b7uqkmdj@google.com');
    expect(icsEvents.length).toBe(1);
    const icsEvent = icsEvents[0];
    expect(icsEvent.decryptedContent.title).toBe('Example event');
    expect(icsEvent.localMetadata.syncState).toBe(EventSyncState.Waiting);
  });
});
