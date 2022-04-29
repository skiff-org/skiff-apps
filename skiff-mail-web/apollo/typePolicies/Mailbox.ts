import { FieldPolicy } from '@apollo/client';
import { last, uniqBy } from 'lodash';

import { PageInfo } from '../../generated/graphql';
import { assertExists } from '../../utils/typeUtils';

export const mailboxFieldPolicy: FieldPolicy = {
  keyArgs: ['request', ['label']],
  merge: (existing, incoming, { readField, args }) => {
    if (!existing) {
      return incoming;
    }
    if (!incoming?.threads.length) {
      return existing;
    }

    const existingThreadIDs = new Set(existing.threads.map((thread) => readField('threadID', thread)));

    // if every thread in the incoming set of threads already exists, this means that its either a
    // removal operation (ex: moving a thread to another system label) or the result of polling where there
    // was no new threads. therefore, we should take the incoming set of threads and use that to update the cache.
    if (
      incoming.threads.every((thread) => {
        const threadID = readField('threadID', thread);
        return !!threadID && existingThreadIDs.has(threadID);
      })
    ) {
      // if this is the result of polling, and every thread already exists, we should just take the new thread objects
      // but not throw away the rest of the loaded threads via pagination
      if (args?.request.polling) {
        const combinedThreads = [...incoming.threads, ...existing.threads];
        const dedupedThreads = uniqBy(combinedThreads, (thread) => readField('threadID', thread));

        return { ...existing, threads: dedupedThreads, pageInfo: existing.pageInfo };
      }
      return { ...existing, threads: incoming.threads, pageInfo: incoming.pageInfo ?? existing.pageInfo };
    }
    // otherwise, the incoming set of threads could be threads fetched via poll interval or pagination load more. in this case, we should combine the existing
    // threads and the incoming threads and make sure to dedup + sort by time
    else {
      const threadSortByDate = (a, b) => {
        const aTime = readField<Date>('emailsUpdatedAt', a)?.getTime();
        const bTime = readField<Date>('emailsUpdatedAt', b)?.getTime();
        assertExists(aTime, `thread ${readField('threadID', a)} does not have a last updated time`);
        assertExists(bTime, `thread ${readField('threadID', b)} does not have a last updated time`);
        return bTime - aTime;
      };

      const lastIncomingThread: any = last(incoming.threads);
      const lastExistingThread: any = last(existing.threads);

      // if the incoming threads are newer than the existing threads then it was fetched via polling, so we want to maintain the current pageInfo.
      // otherwise, the threads were fetched via pagination load more, so we want to update the pageInfo
      let pageInfo: PageInfo;
      if (
        lastIncomingThread &&
        lastExistingThread &&
        (readField<Date>('emailsUpdatedAt', lastIncomingThread)?.getTime() ?? 0) >
          (readField<Date>('emailsUpdatedAt', lastExistingThread)?.getTime() ?? 0)
      ) {
        pageInfo = existing.pageInfo;
      } else {
        pageInfo = incoming.pageInfo;
      }

      const combinedThreads = [...incoming.threads, ...existing.threads];
      const dedupedThreads = uniqBy(combinedThreads, (thread) => readField('threadID', thread));
      const sortedThreads = dedupedThreads.sort(threadSortByDate);

      return {
        ...existing,
        threads: sortedThreads,
        pageInfo
      };
    }
  }
};
