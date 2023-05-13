import uniq from 'lodash/uniq';
import { decryptDatagram, decryptSessionKey } from 'skiff-crypto-v2';
import { EmailFragment, ThreadFragment } from 'skiff-front-graphql';
import { requireCurrentUserData } from 'skiff-front-utils';
import {
  ActionType,
  FilterAction,
  FilterField,
  FilterType,
  MailFilter,
  MailFilterField,
  MailboxCursor
} from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import { SubjectTextDatagram, BodyTextDatagram } from '../../crypto/filters';

import { EmailAliases, UserLabelIDToThreadIDs, SystemLabelToThreadIDs } from './mailFiltering.types';
import {
  applyLabelsToThreads,
  decryptEmailTextAndSubject,
  fetchClientsideFilters,
  fetchUnfilteredThreads,
  markThreadsAsClientsideFiltered,
  markThreadsAsRead
} from './mailFiltering.utils';

const normalize = (value: string) => value.toLowerCase().trim();

/**
 * Checks if the given list of email addresses matches the filter
 * The filter should have a filter type of To, CC, BCC, From, or Recipient
 */
export const addressListMatchesAddressFilter = (normalizedAddresses: string[], filter: MailFilterField) => {
  const { filterType, subFilter, serializedData, filterField } = filter;
  if (![FilterType.To, FilterType.Bcc, FilterType.Cc, FilterType.From, FilterType.Recipient].includes(filterType)) {
    console.error(`Invalid filter type: ${filter.filterType}`);
    return false;
  }
  if (!subFilter || subFilter.length === 0) {
    if (serializedData) {
      const normalizedAddress = normalize(serializedData);
      if (filterField === FilterField.Contains) {
        return normalizedAddresses.some((address) => serializedData && address.includes(normalizedAddress));
      } else if (!filterField) {
        // exact match if no filter field is given
        return normalizedAddresses.some((address) => address === normalizedAddress);
      } else {
        console.error('addressListMatchesAddressFilter called with a filter that has invalid filterField');
        return false;
      }
    } else {
      console.error('addressListMatchesAddressFilter called with a filter that has no serializedData');
      return false;
    }
  } else {
    console.error('addressListMatchesAddressFilter called with a filter that has a sub filter');
    return false;
  }
};

/**
 * Given an email, checks if it matches the filter conditions
 */
export const emailMatchesFilter = (
  email: EmailFragment,
  filter: MailFilterField,
  normalizedAddresses: EmailAliases,
  decryptedSessionKey?: string
): boolean => {
  const { text: decryptedText, subject: decryptedSubject } = decryptEmailTextAndSubject(email);
  const { to, cc, bcc, from } = normalizedAddresses;
  const { filterType, serializedData, subFilter } = filter;
  switch (filterType) {
    case FilterType.To:
      return addressListMatchesAddressFilter(to, filter);
    case FilterType.Cc:
      return addressListMatchesAddressFilter(cc, filter);
    case FilterType.Bcc:
      return addressListMatchesAddressFilter(bcc, filter);
    case FilterType.From:
      return addressListMatchesAddressFilter([from], filter);
    case FilterType.Recipient:
      return addressListMatchesAddressFilter([...to, ...cc, ...bcc], filter);
    case FilterType.Subject:
      // decrypt subject value
      if (!decryptedSessionKey || !serializedData) {
        console.error(`Could not decrypt subject value. Skipping filter for emailID: ${email.id}.`);
        return false;
      }
      const decryptedSubjectFilterValue = decryptDatagram(SubjectTextDatagram, decryptedSessionKey, serializedData).body
        .text;
      const normalizedSubjectValue = normalize(decryptedSubjectFilterValue);
      const normalizedDecryptedSubject = normalize(decryptedSubject);
      return normalizedDecryptedSubject.includes(normalizedSubjectValue);
    case FilterType.Body:
      // decrypt body value
      if (!decryptedSessionKey || !serializedData) {
        console.error(`Could not decrypt body value. Skipping filter for emailID: ${email.id}.`);
        return false;
      }
      const decryptedBodyFilterValue = decryptDatagram(BodyTextDatagram, decryptedSessionKey, serializedData).body.text;
      const normalizedBodyValue = normalize(decryptedBodyFilterValue);
      const normalizedDecryptedText = normalize(decryptedText);
      return normalizedDecryptedText.includes(normalizedBodyValue);
    case FilterType.And:
      if (!subFilter) return false;
      return subFilter
        .map((subFilterFilter) => emailMatchesFilter(email, subFilterFilter, normalizedAddresses, decryptedSessionKey))
        .every((result) => result);
    case FilterType.Or:
      if (!subFilter) return false;
      return subFilter
        .map((subFilterFilter) => emailMatchesFilter(email, subFilterFilter, normalizedAddresses, decryptedSessionKey))
        .some((result) => result);
    case FilterType.Not:
      if (!subFilter) return false;
      if (subFilter.length !== 1 || !subFilter[0]) {
        console.error(`NOT filter must have exactly one subfilter. Skipping filter for emailID: ${email.id}.`);
        return false;
      }
      return !emailMatchesFilter(email, subFilter[0], normalizedAddresses, decryptedSessionKey);
    default:
      console.error(`Invalid filter type ${filter.filterType}. Skipping filter for emailID: ${email.id}. `);
      return false;
  }
};

/**
 * Helper to create a dictionary of label to threadsIDs that
 * need that label applied
 */
const getThreadsToApplyPerLabel = (
  actions: FilterAction[],
  actionType: ActionType,
  threadID: string,
  initialLabelToThreadIDs: UserLabelIDToThreadIDs
) => {
  const labelsToApply = actions
    .filter((action) => action.actionType === actionType)
    .map((action) => action.serializedData)
    .filter(filterExists);

  return labelsToApply.reduce((acc, label) => {
    acc[label] = [...(acc[label] || []), threadID];
    return acc;
  }, initialLabelToThreadIDs);
};

/**
 * Given a list of threads and filters, aggregates all actions that need to be taken.
 * This will return various dictionaries indicating which user labels/system labels
 * need to be applied to which threads, and which threads need to be marked as read.
 */
export const aggregateMailFilterActionsForThreads = (
  threadsToApplyFilterTo: ThreadFragment[],
  clientSideFilters: MailFilter[],
  privateKey: string
): {
  userLabelToThreadIDs: UserLabelIDToThreadIDs;
  systemLabelToThreadIDs: SystemLabelToThreadIDs;
  threadsToMarkAsRead: string[];
} => {
  let userLabelToThreadIDs: UserLabelIDToThreadIDs = {};
  let systemLabelToThreadIDs: SystemLabelToThreadIDs = {};
  const threadsToMarkAsRead: string[] = [];
  threadsToApplyFilterTo.forEach((thread) => {
    // only match the filter against the latest email in the thread
    // TODO: handle case when thread has multiple new emails. maybe have clientsideFiltersApplied as a Date?
    const latestEmail = thread.emails.at(-1);
    if (!latestEmail) return;
    clientSideFilters.forEach((filter) => {
      const normalizedAliases: EmailAliases = {
        to: latestEmail.to.map((to) => normalize(to.address)),
        cc: latestEmail.cc.map((cc) => normalize(cc.address)),
        bcc: latestEmail.bcc.map((bcc) => normalize(bcc.address)),
        from: normalize(latestEmail.from.address)
      };

      const { encryptedSessionKey, encryptedByKey, clientside } = filter;
      // Check for keys if it's a client side filter. Client side filters must have keys
      // in order to decrypt the conditions.
      const hasKeys = !!encryptedSessionKey && !!encryptedByKey;
      if (!hasKeys && clientside) return;
      const decryptedSessionKey =
        clientside && hasKeys ? decryptSessionKey(encryptedSessionKey, privateKey, { key: encryptedByKey }) : undefined;

      if (emailMatchesFilter(latestEmail, filter.filter, normalizedAliases, decryptedSessionKey)) {
        // Store labels to apply to take
        userLabelToThreadIDs = getThreadsToApplyPerLabel(
          filter.actions,
          ActionType.ApplyLabel,
          thread.threadID,
          userLabelToThreadIDs
        );
        systemLabelToThreadIDs = getThreadsToApplyPerLabel(
          filter.actions,
          ActionType.ApplySystemLabel,
          thread.threadID,
          systemLabelToThreadIDs
        );

        // Keep track of if the thread needs to be marked as read
        const shouldMarkAsRead = filter.actions.some((action) => action.actionType === ActionType.MarkAsRead);
        if (shouldMarkAsRead) threadsToMarkAsRead.push(thread.threadID);
      }
    });
  });

  return {
    userLabelToThreadIDs,
    systemLabelToThreadIDs,
    threadsToMarkAsRead
  };
};

/**
 * Run all unfiltered threads through the client side mail filters
 */
export const runClientSideMailFilters = async () => {
  const currentUser = requireCurrentUserData();
  const { privateKey } = currentUser.privateUserData;
  let cursor: MailboxCursor | null = null;

  try {
    // Get all client side mail filters
    const clientSideFilters = await fetchClientsideFilters();

    // Continue paginating through the threads that have not yet run through
    // the client side filters until there are no more
    while (true) {
      // fetch for all threads where we have not yet applied client side filters
      const mailboxData = await fetchUnfilteredThreads(cursor);
      const threadsToApplyFilterTo: ThreadFragment[] = mailboxData?.threads ?? [];
      // if there are none, break
      if (!threadsToApplyFilterTo) break;

      // run the client side filters on those threads
      const { userLabelToThreadIDs, systemLabelToThreadIDs, threadsToMarkAsRead } =
        aggregateMailFilterActionsForThreads(threadsToApplyFilterTo, clientSideFilters, privateKey);

      // take the appropriate actions for those threads: apply label, mark as read/unread
      // these will return the threadIDs that it failed to apply actions to,
      // which we will use later to determine which threads to mark as successfully having
      // client side filter applied
      const [threadIDsThatFailedToApplyLabels, threadIDsThatFailedToMarkAsRead] = await Promise.all([
        applyLabelsToThreads(userLabelToThreadIDs, systemLabelToThreadIDs),
        markThreadsAsRead(threadsToMarkAsRead)
      ]);

      // Determine which threads had an action had failed to execute
      const allThreadIDs = threadsToApplyFilterTo.map((thread) => thread.threadID);
      const threadIDsThatFailedToApplyAction = uniq([
        ...threadIDsThatFailedToApplyLabels,
        ...threadIDsThatFailedToMarkAsRead
      ]);
      // Determine the threads that had all actions applied
      const successfullyFilteredThreadIDs = allThreadIDs.filter(
        (threadID) => !threadIDsThatFailedToApplyAction.includes(threadID)
      );
      // Update the successfullyFilteredThreadIDs to be marked as clientsideFilterApplied = true
      // so that they are not run through the front end filters again (until a new email is received
      // on that thread)
      if (successfullyFilteredThreadIDs.length) {
        await markThreadsAsClientsideFiltered(successfullyFilteredThreadIDs);
      }

      // update cursor to fetch the next page
      cursor = !!mailboxData?.pageInfo.cursor
        ? { threadID: mailboxData.pageInfo.cursor.threadID, date: mailboxData.pageInfo.cursor.date }
        : null;

      // No more threads to fetch
      if (!mailboxData?.pageInfo.hasNextPage) break;
    }
  } catch (e) {
    console.error(e);
  }
};
