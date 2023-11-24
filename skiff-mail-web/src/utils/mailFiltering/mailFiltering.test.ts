import { EmailFragment } from 'skiff-front-graphql';
import * as skiffFrontUtils from 'skiff-front-utils';
import { ActionType, FilterField, FilterType, MailFilter, SystemLabels } from 'skiff-graphql';
import { v4 } from 'uuid';

import { MOCK_EMAIL } from '../../../tests/mocks/mockEmail';
import { MOCK_THREAD } from '../../../tests/mocks/mockThread';
import { ThreadDetailInfo } from '../../models/thread';

import { runClientSideMailFilters } from './mailFiltering';
import * as mailFilteringUtils from './mailFiltering.utils';

const PRIVATE_KEY = 'privateKey';

// MOCKS
jest.mock('skiff-front-utils', () => ({
  __esModule: true,
  requireCurrentUserData: () => ({
    userID: 'id',
    username: '1@skiff.com',
    privateUserData: {
      privateKey: PRIVATE_KEY
    }
  }),
  aggregateMailFilterActionsForThreads: jest.fn()
}));

jest.mock('./mailFiltering.utils', () => ({
  fetchUnfilteredThreads: jest.fn(),
  fetchClientsideFilters: jest.fn(),
  applyLabelsToThreads: jest.fn(),
  applySystemLabelsToThreads: jest.fn(),
  markThreadsAsRead: jest.fn(),
  markThreadsAsClientsideFiltered: jest.fn(),
  decryptEmailTextAndSubject: jest.fn()
}));

jest.mock('../mailboxUtils', () => ({
  updateThreadAsReadUnread: jest.fn()
}));

describe('runClientSideMailFilters', () => {
  const decryptedSubjectOfEmailMatchingSubjectFilter = 'test subject';
  const labelIDToApply = v4();
  const systemLabelToMoveTo = SystemLabels.Trash;
  const clientSideFilters: MailFilter[] = [
    {
      mailFilterID: v4(),
      filter: {
        filterType: FilterType.Subject,
        serializedData: 'encryptedSubject',
        filterField: FilterField.Contains
      },
      clientside: true,
      actions: [
        { actionType: ActionType.ApplyLabel, serializedData: labelIDToApply },
        { actionType: ActionType.ApplySystemLabel, serializedData: systemLabelToMoveTo },
        { actionType: ActionType.MarkAsRead }
      ],
      encryptedByKey: 'encryptedByKey',
      encryptedSessionKey: 'encryptedSessionKey'
    }
  ];

  const threadMatchingFilterID = v4();
  const emailMatchingFilter: EmailFragment = {
    ...MOCK_EMAIL,
    decryptedSubject: decryptedSubjectOfEmailMatchingSubjectFilter,
    to: [{ address: 'to@skiff.com' }],
    cc: [],
    bcc: [],
    from: { address: 'from@skiff.com' }
  };

  const threadsToApplyFilterTo: ThreadDetailInfo[] = [
    { ...MOCK_THREAD, emails: [emailMatchingFilter], threadID: threadMatchingFilterID }
  ];

  beforeEach(() => {
    (mailFilteringUtils.fetchUnfilteredThreads as jest.Mock).mockResolvedValue({
      pageInfo: { hasNextPage: false, cursor: undefined },
      threads: threadsToApplyFilterTo
    });
    (mailFilteringUtils.fetchClientsideFilters as jest.Mock).mockResolvedValue(clientSideFilters);
    (mailFilteringUtils.markThreadsAsRead as jest.Mock).mockResolvedValue([]);
    (mailFilteringUtils.applyLabelsToThreads as jest.Mock).mockResolvedValue([]);
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockReturnValue({
      text: 'test body',
      subject: decryptedSubjectOfEmailMatchingSubjectFilter
    });
  });

  afterEach(() => {
    // reset all mocks
    // (skiffCrypto.decryptDatagramV2 as jest.Mock).mockClear();
    (mailFilteringUtils.fetchUnfilteredThreads as jest.Mock).mockClear();
    (mailFilteringUtils.fetchClientsideFilters as jest.Mock).mockClear();
    (mailFilteringUtils.markThreadsAsRead as jest.Mock).mockClear();
    (mailFilteringUtils.applyLabelsToThreads as jest.Mock).mockClear();
    (mailFilteringUtils.markThreadsAsClientsideFiltered as jest.Mock).mockClear();
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockClear();
  });

  it('applies filters to threads that match the conditions', async () => {
    const expectedLabelToThreadIDs = {
      [labelIDToApply]: [threadMatchingFilterID]
    };
    const expectedSystemLabelToThreadIDs = {
      [systemLabelToMoveTo]: [threadMatchingFilterID]
    };

    (skiffFrontUtils.aggregateMailFilterActionsForThreads as jest.Mock).mockReturnValue({
      userLabelToThreadIDs: expectedLabelToThreadIDs,
      systemLabelToThreadIDs: expectedSystemLabelToThreadIDs,
      threadsToMarkAsRead: [threadMatchingFilterID]
    });

    await runClientSideMailFilters();

    // Expect labels to be applied + thread to be marked as read
    expect(mailFilteringUtils.markThreadsAsRead).toHaveBeenCalledWith([threadMatchingFilterID]);
    expect(mailFilteringUtils.applyLabelsToThreads).toHaveBeenCalledWith(
      expectedLabelToThreadIDs,
      expectedSystemLabelToThreadIDs
    );
    // Assert that we call the mutation to update the thread to clientsideFilterApplied = true
    expect(mailFilteringUtils.markThreadsAsClientsideFiltered).toHaveBeenCalledWith([threadMatchingFilterID]);
  });

  it('does not mark threads with actions that failed to apply as successfully filtered', async () => {
    (mailFilteringUtils.applyLabelsToThreads as jest.Mock).mockResolvedValue([threadMatchingFilterID]);

    await runClientSideMailFilters();

    // Assert that we do not call the mutation to update the thread to clientsideFilterApplied = true
    expect(mailFilteringUtils.markThreadsAsClientsideFiltered).not.toBeCalled();
  });

  it('paginates through all threads that have not yet run through the filters', async () => {
    (mailFilteringUtils.fetchUnfilteredThreads as jest.Mock)
      // first call to get threads returns with next page as true
      .mockResolvedValueOnce({
        pageInfo: {
          hasNextPage: true,
          cursor: { threadID: v4(), date: new Date() }
        },
        threads: threadsToApplyFilterTo
      })
      // second call to get threads returns with next page as false, so we stop paginating
      .mockResolvedValueOnce({
        pageInfo: {
          hasNextPage: false,
          cursor: null
        },
        threads: []
      });

    await runClientSideMailFilters();

    expect(mailFilteringUtils.fetchUnfilteredThreads).toHaveBeenCalledTimes(2);
  });
});
