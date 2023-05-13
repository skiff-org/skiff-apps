import * as skiffCryptoV2 from 'skiff-crypto-v2';
import { EmailFragment, ThreadFragment } from 'skiff-front-graphql';
import { ActionType, FilterField, FilterType, MailFilter, MailFilterField, SystemLabels } from 'skiff-graphql';
import { v4 } from 'uuid';

import { MOCK_EMAIL } from '../../__mocks__/mockEmail';
import { MOCK_THREAD } from '../../__mocks__/mockThread';
import { ThreadDetailInfo } from '../../models/thread';

import {
  addressListMatchesAddressFilter,
  aggregateMailFilterActionsForThreads,
  emailMatchesFilter,
  runClientSideMailFilters
} from './mailFiltering';
import { UserLabelIDToThreadIDs, SystemLabelToThreadIDs } from './mailFiltering.types';
import * as mailFilteringUtils from './mailFiltering.utils';

const PRIVATE_KEY = 'privateKey';

// MOCKS
jest.mock('skiff-crypto-v2', () => ({
  __esModule: true,
  decryptSessionKey: () => 'decryptedSessionKey',
  decryptDatagram: jest.fn()
}));

jest.mock('skiff-front-utils', () => ({
  __esModule: true,
  requireCurrentUserData: () => ({
    userID: 'id',
    username: '1@skiff.com',
    privateUserData: {
      privateKey: PRIVATE_KEY
    }
  })
}));

jest.mock('../../crypto/filters', () => ({
  SubjectTextDatagram: '',
  BodyTextDatagram: ''
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

describe('addressListMatchesAddressFilter', () => {
  const addresses = ['test@skiff.com'];

  it('returns true if the normalized serializedData matches any address in the list', () => {
    const filter: MailFilterField = {
      filterType: FilterType.From,
      serializedData: ' tEsT@skiff.com'
    };
    expect(addressListMatchesAddressFilter(addresses, filter)).toBe(true);
  });

  it('returns false if filter has a sub filter as it is an invalid filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Recipient,
      subFilter: [{ filterType: FilterType.To, serializedData: 'test2' }]
    };
    expect(addressListMatchesAddressFilter(addresses, filter)).toBe(false);
  });

  it('returns false if serializedData is empty', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: ''
    };
    expect(addressListMatchesAddressFilter(addresses, filter)).toBe(false);
  });

  it('returns false if serializedData is not found when filterField is "Contains"', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: 'xyz',
      filterField: FilterField.Contains
    };
    expect(addressListMatchesAddressFilter(addresses, filter)).toBe(false);
  });

  it('returns true if serializedData is found when filterField is "Contains"', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: 'est',
      filterField: FilterField.Contains
    };
    expect(addressListMatchesAddressFilter(addresses, filter)).toBe(true);
  });
});

describe('emailMatchesFilter', () => {
  const fromAddress = 'from@skiff.com';
  const toAddress1 = 'to1@skiff.com';
  const toAddress2 = 'to2@skiff.com';
  const ccAddress = 'cc@skiff.com';
  const decryptedSubject = 'Test Subject';
  const decryptedText = 'Test Body';
  const email: EmailFragment = {
    ...MOCK_EMAIL,
    id: v4(),
    to: [{ address: toAddress1 }, { address: toAddress2 }],
    cc: [{ address: ccAddress }],
    bcc: [],
    from: { address: fromAddress }
  };

  // Take the first word of the decrypted subject of the email
  const valueMatchingDecryptedSubject = decryptedSubject.split(' ')[0];
  // Take the second word of the decrypted body of the email
  const valueMatchingDecryptedBodyText = decryptedText.split(' ')[1];
  const normalizedAddresses = {
    to: [toAddress1, toAddress2],
    cc: [ccAddress],
    bcc: [],
    from: fromAddress
  };
  const decryptedSessionKey = 'testSessionKey';

  beforeEach(() => {
    // Mock for decrypting the email contents
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockReturnValue({
      text: decryptedText,
      subject: decryptedSubject
    });
  });

  afterEach(() => {
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockClear();
  });

  it('returns true if email matches TO filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: toAddress1
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match TO filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: ccAddress // not a TO address
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches CC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Cc,
      serializedData: ccAddress
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match CC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Cc,
      serializedData: toAddress1 // not a CC address
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(false);
  });

  it('returns false if email does not match BCC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Bcc,
      serializedData: toAddress1 // bcc for email is empty, so nothing should match
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches FROM filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.From,
      serializedData: fromAddress
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match FROM filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.From,
      serializedData: toAddress1 // not the from address
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches RECIPIENT filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Recipient,
      serializedData: toAddress2 // Recipient includes TO, CC, BCC
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match RECIPIENT filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Recipient,
      serializedData: fromAddress // not a TO, CC, or BCC address
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches SUBJECT filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedSubject } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedSubject',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match SUBJECT filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedSubject',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });

  it('returns true if email matches BODY filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedBodyText } });
    const filter: MailFilterField = {
      filterType: FilterType.Body,
      serializedData: 'encryptedBody',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match BODY filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedBody',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });

  it('returns true if email matches a NOT filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Not,
      subFilter: [
        {
          filterType: FilterType.To,
          serializedData: fromAddress
        }
      ]
    };
    expect(emailMatchesFilter(email, filter, normalizedAddresses)).toBe(true);
  });

  it('returns true if email matches filter with OR conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Or,
      subFilter: [
        { filterType: FilterType.To, serializedData: toAddress1 },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email should still match the filter as the TO address matches, even though
    // the subject does not match
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match filter with OR conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Or,
      subFilter: [
        { filterType: FilterType.To, serializedData: fromAddress },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email does not match the filter as it does not match any of the conditions in the filter
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });

  it('returns true if email matches filter with AND conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedSubject } });
    const filter: MailFilterField = {
      filterType: FilterType.And,
      subFilter: [
        { filterType: FilterType.To, serializedData: toAddress1 },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email matches the filter as it not matches all of the conditions in the filter
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match filter with AND conditions', () => {
    const filter: MailFilterField = {
      filterType: FilterType.And,
      subFilter: [
        { filterType: FilterType.To, serializedData: toAddress1 },
        { filterType: FilterType.From, serializedData: toAddress1 }
      ]
    };

    // email does not match the filter as it does not match all of the conditions in the filter
    expect(emailMatchesFilter(email, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });
});

describe('aggregateMailFilterActionsForThreads', () => {
  it('aggregates actions to apply for threads matching filters', () => {
    const decryptedSubjectOfEmailMatchingSubjectFilter = 'test subject';
    // Return the decrypted subjected filter value as the first word
    // of the subject of the email that should match the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({
      body: { text: decryptedSubjectOfEmailMatchingSubjectFilter.split(' ')[0] }
    });

    const folderIDToMoveTo = v4();
    const userLabelIDToApply = v4();
    const systemLabelToMoveTo = SystemLabels.Trash;
    const toAddressOfEmailMatchingToFilter = 'test@skiff.com';
    const subjectFilter: MailFilter = {
      mailFilterID: v4(),
      filter: {
        filterType: FilterType.Subject,
        serializedData: 'encryptedSubject',
        filterField: FilterField.Contains
      },
      clientside: true,
      actions: [
        { actionType: ActionType.ApplyLabel, serializedData: folderIDToMoveTo },
        { actionType: ActionType.ApplyLabel, serializedData: userLabelIDToApply },
        { actionType: ActionType.MarkAsRead }
      ],
      encryptedByKey: 'encryptedByKey',
      encryptedSessionKey: 'encryptedSessionKey'
    };
    const toFilter: MailFilter = {
      mailFilterID: v4(),
      filter: {
        filterType: FilterType.To,
        serializedData: toAddressOfEmailMatchingToFilter
      },
      clientside: true,
      actions: [
        { actionType: ActionType.ApplySystemLabel, serializedData: systemLabelToMoveTo },
        { actionType: ActionType.ApplyLabel, serializedData: userLabelIDToApply }
      ],
      encryptedByKey: 'encryptedByKey',
      encryptedSessionKey: 'encryptedSessionKey'
    };
    const filter: MailFilter[] = [subjectFilter, toFilter];

    const threadMatchingSubjectFilterID = v4();
    const emailMatchingSubjectFilterID = v4();
    const emailMatchingSubjectFilter: EmailFragment = {
      ...MOCK_EMAIL,
      id: emailMatchingSubjectFilterID,
      to: [{ address: 'to@skiff.com' }] // this is different from the to address of emailMatchingToFilter so that this email does not match the TO filter
    };

    const threadMatchingToFilterID = v4();
    const emailMatchingToFilterID = v4();
    const emailMatchingToFilter: EmailFragment = {
      ...MOCK_EMAIL,
      id: emailMatchingToFilterID,
      to: [{ address: toAddressOfEmailMatchingToFilter }],
      cc: [],
      bcc: [],
      from: { address: 'from@skiff.com' }
    };

    const threadsToApplyFilterTo: ThreadFragment[] = [
      { ...MOCK_THREAD, emails: [emailMatchingSubjectFilter], threadID: threadMatchingSubjectFilterID },
      { ...MOCK_THREAD, emails: [emailMatchingToFilter], threadID: threadMatchingToFilterID }
    ];

    // Mock the subject content so that the emailMatchingSubjectFilterID will match the SUBJECT filter
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockImplementation((email: EmailFragment) => {
      return {
        text: 'test body',
        subject:
          email.id === emailMatchingSubjectFilterID ? decryptedSubjectOfEmailMatchingSubjectFilter : 'does not match'
      };
    });

    const aggregatedActions = aggregateMailFilterActionsForThreads(threadsToApplyFilterTo, filter, PRIVATE_KEY);
    // the SUBJECT filter moves threads to the folder and applies labels to threads
    // the TO filter applies labels to threads
    const expectedLabelToThreadIDs: UserLabelIDToThreadIDs = {
      [folderIDToMoveTo]: [threadMatchingSubjectFilterID],
      [userLabelIDToApply]: [threadMatchingToFilterID, threadMatchingSubjectFilterID]
    };
    // the TO filter moves threads to a system label
    const expectedSystemLabelToThreadIDs: SystemLabelToThreadIDs = {
      [systemLabelToMoveTo]: [threadMatchingToFilterID]
    };
    // the SUBJECT filter marks threads as read
    const expectedThreadsToMarkAsRead: string[] = [threadMatchingSubjectFilterID];

    expect(Object.keys(aggregatedActions.userLabelToThreadIDs)).toHaveLength(2);
    expect(aggregatedActions.userLabelToThreadIDs[folderIDToMoveTo]).toEqual(
      expect.arrayContaining(expectedLabelToThreadIDs[folderIDToMoveTo] ?? [])
    );
    expect(aggregatedActions.userLabelToThreadIDs[userLabelIDToApply]).toEqual(
      expect.arrayContaining(expectedLabelToThreadIDs[userLabelIDToApply] ?? [])
    );
    expect(aggregatedActions.systemLabelToThreadIDs).toEqual(expectedSystemLabelToThreadIDs);
    expect(aggregatedActions.threadsToMarkAsRead).toEqual(expectedThreadsToMarkAsRead);
  });
});

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
    // Return the decrypted subjected filter value as the first word
    // of the subject of the email that should match the filter
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockReturnValue({
      body: { text: decryptedSubjectOfEmailMatchingSubjectFilter.split(' ')[0] }
    });
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
    (skiffCryptoV2.decryptDatagram as jest.Mock).mockClear();
    (mailFilteringUtils.fetchUnfilteredThreads as jest.Mock).mockClear();
    (mailFilteringUtils.fetchClientsideFilters as jest.Mock).mockClear();
    (mailFilteringUtils.markThreadsAsRead as jest.Mock).mockClear();
    (mailFilteringUtils.applyLabelsToThreads as jest.Mock).mockClear();
    (mailFilteringUtils.markThreadsAsClientsideFiltered as jest.Mock).mockClear();
    (mailFilteringUtils.decryptEmailTextAndSubject as jest.Mock).mockClear();
  });

  it('applies filters to threads that match the conditions', async () => {
    await runClientSideMailFilters();

    const expectedLabelToThreadIDs: UserLabelIDToThreadIDs = {
      [labelIDToApply]: [threadMatchingFilterID]
    };
    const expectedSystemLabelToThreadIDs: SystemLabelToThreadIDs = {
      [systemLabelToMoveTo]: [threadMatchingFilterID]
    };
    // Except labels to be applied + thread to be marked as read
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
