import { decryptDatagramV2, decryptSessionKey } from 'skiff-crypto';
import { BodyTextDatagram, SubjectTextDatagram } from 'skiff-front-graphql';
import { ActionType, FilterAction, FilterField, FilterType, MailFilter, MailFilterField } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import {
  UserLabelIDToThreadIDs,
  SystemLabelToThreadIDs,
  MsgEmailAliases,
  EmailFilteringInfo,
  ThreadForFiltering
} from './mailFilteringUtils.types';

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
  emailContent: EmailFilteringInfo,
  filter: MailFilterField,
  normalizedAddresses: MsgEmailAliases,
  decryptedSessionKey?: string
): boolean => {
  const { id, decryptedText, decryptedSubject } = emailContent;
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
        console.error(`Could not decrypt subject value. Skipping filter for emailID: ${id}.`);
        return false;
      }
      const decryptedSubjectFilterValue = decryptDatagramV2(SubjectTextDatagram, decryptedSessionKey, serializedData)
        .body.text;
      const normalizedSubjectValue = normalize(decryptedSubjectFilterValue);
      const normalizedDecryptedSubject = normalize(decryptedSubject);
      return normalizedDecryptedSubject.includes(normalizedSubjectValue);
    case FilterType.Body:
      // decrypt body value
      if (!decryptedSessionKey || !serializedData) {
        console.error(`Could not decrypt body value. Skipping filter for emailID: ${id}.`);
        return false;
      }
      const decryptedBodyFilterValue = decryptDatagramV2(BodyTextDatagram, decryptedSessionKey, serializedData).body
        .text;
      const normalizedBodyValue = normalize(decryptedBodyFilterValue);
      const normalizedDecryptedText = normalize(decryptedText);
      return normalizedDecryptedText.includes(normalizedBodyValue);
    case FilterType.And:
      if (!subFilter) return false;
      return subFilter
        .map((subFilterFilter) =>
          emailMatchesFilter(emailContent, subFilterFilter, normalizedAddresses, decryptedSessionKey)
        )
        .every((result) => result);
    case FilterType.Or:
      if (!subFilter) return false;
      return subFilter
        .map((subFilterFilter) =>
          emailMatchesFilter(emailContent, subFilterFilter, normalizedAddresses, decryptedSessionKey)
        )
        .some((result) => result);
    case FilterType.Not:
      if (!subFilter) return false;
      if (subFilter.length !== 1 || !subFilter[0]) {
        console.error(`NOT filter must have exactly one subfilter. Skipping filter for emailID: ${emailContent.id}.`);
        return false;
      }
      return !emailMatchesFilter(emailContent, subFilter[0], normalizedAddresses, decryptedSessionKey);
    default:
      console.error(`Invalid filter type ${filter.filterType}. Skipping filter for emailID: ${emailContent.id}. `);
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
  threadsToApplyFilterTo: ThreadForFiltering[],
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
    const { latestEmail, id: threadID, aliases } = thread;
    if (!latestEmail) return;
    clientSideFilters.forEach((filter) => {
      const normalizedAliases: MsgEmailAliases = {
        to: aliases.to.map(normalize),
        cc: aliases.cc.map(normalize),
        bcc: aliases.bcc.map(normalize),
        from: normalize(aliases.from)
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
          threadID,
          userLabelToThreadIDs
        );
        systemLabelToThreadIDs = getThreadsToApplyPerLabel(
          filter.actions,
          ActionType.ApplySystemLabel,
          threadID,
          systemLabelToThreadIDs
        );

        // Keep track of if the thread needs to be marked as read
        const shouldMarkAsRead = filter.actions.some((action) => action.actionType === ActionType.MarkAsRead);
        if (shouldMarkAsRead) threadsToMarkAsRead.push(threadID);
      }
    });
  });

  return {
    userLabelToThreadIDs,
    systemLabelToThreadIDs,
    threadsToMarkAsRead
  };
};
