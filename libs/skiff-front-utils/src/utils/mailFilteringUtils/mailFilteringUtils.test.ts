import * as skiffCrypto from 'skiff-crypto';
import { ActionType, FilterField, FilterType, MailFilter, MailFilterField, SystemLabels } from 'skiff-graphql';
import { v4 } from 'uuid';

import {
  addressListMatchesAddressFilter,
  aggregateMailFilterActionsForThreads,
  emailMatchesFilter
} from './mailFilteringUtils';
import {
  EmailFilteringInfo,
  SystemLabelToThreadIDs,
  ThreadForFiltering,
  UserLabelIDToThreadIDs
} from './mailFilteringUtils.types';

const PRIVATE_KEY = 'privateKey';

// MOCKS
jest.mock('skiff-crypto', () => ({
  __esModule: true,
  decryptSessionKey: () => 'decryptedSessionKey',
  decryptDatagramV2: jest.fn(),
  generateSymmetricKey: jest.fn()
}));

jest.mock('skiff-front-graphql', () => ({
  SubjectTextDatagram: '',
  BodyTextDatagram: ''
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
  const emailContent: EmailFilteringInfo = {
    decryptedSubject,
    decryptedText,
    id: v4()
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

  it('returns true if email matches TO filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: toAddress1
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match TO filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.To,
      serializedData: ccAddress // not a TO address
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches CC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Cc,
      serializedData: ccAddress
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match CC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Cc,
      serializedData: toAddress1 // not a CC address
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(false);
  });

  it('returns false if email does not match BCC filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Bcc,
      serializedData: toAddress1 // bcc for email is empty, so nothing should match
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches FROM filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.From,
      serializedData: fromAddress
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match FROM filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.From,
      serializedData: toAddress1 // not the from address
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches RECIPIENT filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Recipient,
      serializedData: toAddress2 // Recipient includes TO, CC, BCC
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(true);
  });

  it('returns false if email does not match RECIPIENT filter', () => {
    const filter: MailFilterField = {
      filterType: FilterType.Recipient,
      serializedData: fromAddress // not a TO, CC, or BCC address
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(false);
  });

  it('returns true if email matches SUBJECT filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedSubject } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedSubject',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match SUBJECT filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedSubject',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });

  it('returns true if email matches BODY filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedBodyText } });
    const filter: MailFilterField = {
      filterType: FilterType.Body,
      serializedData: 'encryptedBody',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match BODY filter', () => {
    // Mock for decrypting serializedData in the filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Subject,
      serializedData: 'encryptedBody',
      filterField: FilterField.Contains
    };
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
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
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses)).toBe(true);
  });

  it('returns true if email matches filter with OR conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Or,
      subFilter: [
        { filterType: FilterType.To, serializedData: toAddress1 },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email should still match the filter as the TO address matches, even though
    // the subject does not match
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
  });

  it('returns false if email does not match filter with OR conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: 'random' } });
    const filter: MailFilterField = {
      filterType: FilterType.Or,
      subFilter: [
        { filterType: FilterType.To, serializedData: fromAddress },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email does not match the filter as it does not match any of the conditions in the filter
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });

  it('returns true if email matches filter with AND conditions', () => {
    // Mock for decrypting serializedData in the SUBJECT filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({ body: { text: valueMatchingDecryptedSubject } });
    const filter: MailFilterField = {
      filterType: FilterType.And,
      subFilter: [
        { filterType: FilterType.To, serializedData: toAddress1 },
        { filterType: FilterType.Subject, serializedData: 'encryptedSubject', filterField: FilterField.Contains }
      ]
    };

    // email matches the filter as it not matches all of the conditions in the filter
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(true);
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
    expect(emailMatchesFilter(emailContent, filter, normalizedAddresses, decryptedSessionKey)).toBe(false);
  });
});

describe('aggregateMailFilterActionsForThreads', () => {
  it('aggregates actions to apply for threads matching filters', () => {
    const decryptedSubjectOfEmailMatchingSubjectFilter = 'test subject';
    // Return the decrypted subjected filter value as the first word
    // of the subject of the email that should match the filter
    (skiffCrypto.decryptDatagramV2 as jest.Mock).mockReturnValue({
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
    const threadMatchingSubjectFilter: ThreadForFiltering = {
      id: threadMatchingSubjectFilterID,
      aliases: {
        to: ['to@skiff.com'], // this is different from the to address of emailMatchingToFilter so that this email does not match the TO filter
        cc: [],
        bcc: [],
        from: 'from@skiff.com'
      },
      latestEmail: {
        id: v4(),
        decryptedSubject: decryptedSubjectOfEmailMatchingSubjectFilter,
        decryptedText: ''
      }
    };

    const threadMatchingToFilterID = v4();
    const threadMatchingToFilter: ThreadForFiltering = {
      id: threadMatchingToFilterID,
      aliases: {
        to: [toAddressOfEmailMatchingToFilter],
        cc: [],
        bcc: [],
        from: 'from@skiff.com'
      },
      latestEmail: { id: v4(), decryptedSubject: '', decryptedText: '' }
    };

    const threadsToApplyFilterTo: ThreadForFiltering[] = [threadMatchingSubjectFilter, threadMatchingToFilter];

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
