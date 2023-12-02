import { ApolloCache } from '@apollo/client';
import {
  MailboxDocument,
  MailboxQuery,
  MailboxQueryVariables,
  ThreadWithoutContentFragment
} from 'skiff-front-graphql';
import { MailboxFilters, Mailbox } from 'skiff-graphql';

import { getSearchWorker } from '../../hooks/useSearchWorker';

export function updateReadUnreadFilterThreads(
  cache: ApolloCache<any>,
  label: string,
  mailboxFilter: MailboxFilters
): void {
  const mailboxQuery = cache.readQuery<MailboxQuery, MailboxQueryVariables>({
    query: MailboxDocument,
    variables: { request: { label, filters: mailboxFilter } }
  });
  const threads = mailboxQuery?.mailbox?.threads ?? [];
  cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
    {
      query: MailboxDocument,
      variables: { request: { label, filters: mailboxFilter } }
    },
    (existingCache) => {
      if (!existingCache?.mailbox) {
        return null;
      }
      return {
        ...existingCache,
        mailbox: {
          ...existingCache.mailbox,
          threads: threads.filter((t) => (mailboxFilter.read ? t.attributes.read : !t.attributes.read)),
          pageInfo: {
            cursor: existingCache?.mailbox?.pageInfo.cursor ?? null,
            hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
          }
        }
      };
    }
  );
}

export function addThreadsToMailboxQuery(
  cache: ApolloCache<any>,
  label: string,
  threadsToAdd: ThreadWithoutContentFragment[]
): void {
  const read = threadsToAdd.every((thread) => thread.attributes.read);
  const filter = read ? { read: true } : { read: false };
  cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
    {
      query: MailboxDocument,
      variables: { request: { label, filters: filter } }
    },
    (existing) => {
      if (!existing?.mailbox) {
        return null;
      }

      const addedThreads = [...threadsToAdd, ...(existing.mailbox.threads ?? [])].sort(
        (a, b) => b.emailsUpdatedAt.getTime() - a.emailsUpdatedAt.getTime()
      );

      return {
        ...existing,
        mailbox: {
          ...existing.mailbox,
          threads: addedThreads
        }
      };
    }
  );

  cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
    {
      query: MailboxDocument,
      variables: { request: { label, filters: {} } }
    },
    (existing) => {
      if (!existing?.mailbox) {
        return null;
      }

      const addedThreads = [...threadsToAdd, ...(existing.mailbox.threads ?? [])].sort(
        (a, b) => b.emailsUpdatedAt.getTime() - a.emailsUpdatedAt.getTime()
      );

      return {
        ...existing,
        mailbox: {
          ...existing.mailbox,
          threads: addedThreads
        }
      };
    }
  );
}

export function removeThreadsFromMailboxQuery(
  cache: ApolloCache<any>,
  label: string,
  threadsToRemove: ThreadWithoutContentFragment[],
  removeThreadsFromSearchIndex?: boolean
): void {
  const read = threadsToRemove.every((thread) => thread.attributes.read);
  const filters = read ? { read: true } : { read: false };

  cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
    {
      query: MailboxDocument,
      variables: { request: { label, filters } }
    },
    (existing) => {
      if (!existing?.mailbox) {
        return null;
      }
      const existingThreads = existing.mailbox.threads ?? [];
      const newThreads = existingThreads.filter((existingThread) => {
        const shouldRemove = threadsToRemove.some((thread) => thread.threadID === existingThread.threadID);
        return !shouldRemove;
      });

      return {
        ...existing,
        mailbox: {
          ...existing.mailbox,
          threads: newThreads
        }
      };
    }
  );

  cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
    {
      query: MailboxDocument,
      variables: { request: { label, filters: {} } }
    },
    (existing) => {
      if (!existing?.mailbox) {
        return null;
      }
      const existingThreads = existing.mailbox.threads ?? [];
      const newThreads = existingThreads.filter((existingThread) => {
        const shouldRemove = threadsToRemove.some((thread) => thread.threadID === existingThread.threadID);
        if (shouldRemove && removeThreadsFromSearchIndex) {
          const searchWorker = getSearchWorker();
          existingThread.emails.forEach((email) => void searchWorker?.remove(email.id));
        }
        return !shouldRemove;
      });

      return {
        ...existing,
        mailbox: {
          ...existing.mailbox,
          threads: newThreads
        }
      };
    }
  );
}

/**
 * Updates all threads in the cache to be read
 */
export function cacheMarkAllRead(cache: ApolloCache<any>, read: boolean) {
  cache.modify({
    fields: {
      mailbox: (previous: Mailbox | undefined) => {
        const newThreads = previous?.threads ? [...previous.threads] : [];
        const updatedThreads = newThreads.map((userThread) => ({
          ...userThread,
          attributes: { ...userThread.attributes, read: read }
        }));
        return { ...previous, threads: updatedThreads };
      }
    }
  });
}
