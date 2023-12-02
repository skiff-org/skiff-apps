import { FieldPolicy } from '@apollo/client';
import { ReadFieldFunction } from '@apollo/client/cache/core/types/common';
import last from 'lodash/last';
import uniqBy from 'lodash/uniqBy';
import { Mailbox, MailboxPageInfo, MailboxRequest, SystemLabels, UserThread } from 'skiff-graphql';

const getUpdatedAtField = (label?: string) => {
  if (label === SystemLabels.Sent) {
    return 'sentLabelUpdatedAt';
  }
  return 'emailsUpdatedAt';
};

const threadSortByDate = (readField: ReadFieldFunction, label?: string) => (a: UserThread, b: UserThread) => {
  const sortField = getUpdatedAtField(label);
  const aTime = readField<Date>(sortField, a)?.getTime() ?? 0;
  const bTime = readField<Date>(sortField, b)?.getTime() ?? 0;
  return bTime - aTime;
};

export const mailboxFieldPolicy: FieldPolicy<Mailbox> = {
  keyArgs: (args) =>
    JSON.stringify({
      // need to use a JSON.stringify function here instead of a normal array because we are including the Date scalar
      // which is just set to `{}` when stringified by Apollo
      label: (args?.request as MailboxRequest)?.label,
      filters: (args?.request as MailboxRequest)?.filters,
      updatedAtOrderDirection: (args?.request as MailboxRequest)?.updatedAtOrderDirection,
      useUpdatedAtField: (args?.request as MailboxRequest)?.useUpdatedAtField,
      lastUpdatedDate: (args?.request as MailboxRequest)?.lastUpdatedDate?.toISOString()
    }),
  read: (existing, { readField, args }) =>
    existing
      ? {
          ...existing,
          threads: [...existing?.threads].sort(
            threadSortByDate(readField, (args?.request as MailboxRequest)?.label || undefined)
          )
        }
      : undefined,
  merge: (existing, incoming, { readField, args }) => {
    if (!existing) {
      return incoming;
    }
    if (!incoming) {
      return existing;
    }

    const label = (args?.request as MailboxRequest)?.label || undefined;

    const existingThreadIDs = new Set(existing.threads.map((thread) => readField('threadID', thread)));

    const isPollingOrRefetching =
      (args?.request as MailboxRequest).polling || (args?.request as MailboxRequest).refetching;
    const isScheduledSend = (args?.request as MailboxRequest).label === SystemLabels.ScheduleSend;
    const didRemoveThreads =
      incoming.threads.length < existing.threads.length &&
      incoming.threads.every((thread) => {
        const threadID = readField('threadID', thread);
        return !!threadID && existingThreadIDs.has(threadID);
      });

    // if incoming is the result of polling or refetching, we'll take all the new incoming threads and replace the existing threads.
    // (there may be no changes)
    // Skip if this is the Scheduled Send mailbox -- some emails could have sent, resulting in the removal of emails
    if (!isScheduledSend && isPollingOrRefetching) {
      const combinedThreads = [...incoming.threads, ...existing.threads];
      const dedupedThreads = uniqBy(combinedThreads, (thread) => readField('threadID', thread));
      return { ...existing, threads: dedupedThreads, pageInfo: existing.pageInfo };
    }
    // if every thread in the incoming set of threads already exists, this means that its a
    // removal operation (ex: moving a thread to another system label)
    else if (didRemoveThreads) {
      return { ...existing, threads: incoming.threads, pageInfo: incoming.pageInfo ?? existing.pageInfo };
    }

    // otherwise, the incoming set of threads are via pagination load more. in this case, we should combine the existing
    // threads and the incoming threads and make sure to dedup + sort by time
    else {
      const lastIncomingThread = last(incoming.threads);
      const lastExistingThread = last(existing.threads);

      // if the incoming threads are newer than the existing threads then it was fetched via polling, so we want to maintain the current pageInfo.
      // otherwise, the threads were fetched via pagination load more, so we want to update the pageInfo
      let pageInfo: MailboxPageInfo;
      if (
        lastIncomingThread &&
        lastExistingThread &&
        (readField<Date>(getUpdatedAtField(label), lastIncomingThread)?.getTime() ?? 0) >
          (readField<Date>(getUpdatedAtField(label), lastExistingThread)?.getTime() ?? 0)
      ) {
        pageInfo = existing.pageInfo;
      } else {
        pageInfo = incoming.pageInfo;
      }

      const combinedThreads = [...incoming.threads, ...existing.threads];
      const dedupedThreads = uniqBy(combinedThreads, (thread) => readField('threadID', thread));
      const sortedThreads = dedupedThreads.sort(threadSortByDate(readField, label));

      return {
        ...existing,
        threads: sortedThreads,
        pageInfo
      };
    }
  }
};
