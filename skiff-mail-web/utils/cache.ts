import { ApolloCache, useApolloClient } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { difference, forEach } from 'lodash';

import {
  MailboxDocument,
  MailboxQuery,
  SystemLabels,
  ThreadFragment,
  ThreadFragmentDoc,
  UpdatedThreadLabels,
  UserLabel,
  UserLabelsDocument,
  UserLabelsQuery
} from '../generated/graphql';
import { useAppSelector } from '../hooks/redux/useAppSelector';
import { getSearchWorker } from '../hooks/useSearchWorker';
import { filterExists } from './typeUtils';

export function updateThreadsWithModifiedLabels(params: {
  cache: ApolloCache<any>;
  updatedThreads: UpdatedThreadLabels[] | null | undefined;
  errors?: readonly GraphQLError[];
}) {
  const { cache, updatedThreads, errors } = params;
  if (errors) {
    console.error('There was an error applying labels', errors);
    return;
  }

  const threadsToRemoveByLabel: Map<string, string[]> = new Map();
  const threadsToAddByLabel: Map<string, string[]> = new Map();

  if (!updatedThreads) return;
  const searchWorker = getSearchWorker();

  // Parse through updatedThreads to determine labels to add/remove
  for (const thread of updatedThreads) {
    const threadID = thread.threadID;
    const cacheID = cache.identify({ __typename: 'UserThread', threadID });
    if (cacheID) {
      cache.updateFragment<ThreadFragment>(
        { id: cacheID, fragment: ThreadFragmentDoc, fragmentName: 'Thread' },
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (existing) => {
          const existingLabels = [
            ...(existing?.attributes.systemLabels ?? []),
            ...(existing?.attributes.userLabels.map((userLabel) => userLabel.labelID) ?? [])
          ];
          const updatedLabels = [...thread.systemLabels, ...thread.userLabels.map((userLabel) => userLabel.labelID)];

          // In a standard case, we'll just add/remove the difference between them
          let labelsToRemoveThreadFrom = difference(existingLabels, updatedLabels);
          let labelsToAddThreadTo = difference(updatedLabels, existingLabels);

          /* Special case: Trash */
          // If we're adding trash, we remove the thread from all other labels and only add it to trash
          if (labelsToAddThreadTo.includes(SystemLabels.Trash)) {
            labelsToRemoveThreadFrom = existingLabels;
            labelsToAddThreadTo = [SystemLabels.Trash];
            // If we're removing trash, we want to now add this thread back to all other labels its now part of
          } else if (labelsToRemoveThreadFrom.includes(SystemLabels.Trash)) {
            labelsToAddThreadTo = updatedLabels;
          }

          // Labels to remove
          for (const labelToRemove of labelsToRemoveThreadFrom) {
            const currentThreadsToRemove = threadsToRemoveByLabel.get(labelToRemove) ?? [];
            threadsToRemoveByLabel.set(labelToRemove, [...currentThreadsToRemove, thread.threadID]);
          }

          // Labels to add
          for (const labelToAdd of labelsToAddThreadTo) {
            const currentThreadsToAdd = threadsToAddByLabel.get(labelToAdd) ?? [];
            threadsToAddByLabel.set(labelToAdd, [...currentThreadsToAdd, thread.threadID]);
          }

          return {
            ...existing,
            attributes: {
              ...existing?.attributes,
              systemLabels: thread.systemLabels,
              userLabels: thread.userLabels
            }
          };
        }
      );
    }
  }
  // For each label, remove all threads that have been marked for removal
  threadsToRemoveByLabel.forEach((threadsToRemove, label) => {
    cache.updateQuery<MailboxQuery>(
      {
        query: MailboxDocument,
        variables: { request: { label } }
      },
      (existingCache) => {
        const existingThreads = existingCache?.mailbox?.threads ?? [];
        // Remove outdated threads from the search index
        if (searchWorker) {
          existingThreads
            .filter((thread) => threadsToRemove.includes(thread.threadID))
            .forEach((thread) => thread.emails.forEach((email) => searchWorker.remove(email.id)));
        }
        return {
          ...existingCache,
          mailbox: {
            ...existingCache?.mailbox,
            threads: existingThreads.filter((thread) => !threadsToRemove.includes(thread.threadID)),
            pageInfo: {
              cursor: existingCache?.mailbox?.pageInfo.cursor ?? null,
              hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
            }
          }
        };
      }
    );
  });

  // For each label, add all threads that have been marked for add
  threadsToAddByLabel.forEach((threadsToAdd, label) => {
    cache.updateQuery<MailboxQuery>(
      {
        query: MailboxDocument,
        variables: { request: { label } }
      },
      (existingCache) => {
        const threadFragments = threadsToAdd
          .map((threadID) => {
            const cacheID = cache.identify({ __typename: 'UserThread', threadID });
            return cache.readFragment<ThreadFragment>({
              id: cacheID,
              fragment: ThreadFragmentDoc,
              fragmentName: 'Thread'
            });
          })
          .filter(Boolean) as ThreadFragment[];

        const addedThreads = [...threadFragments, ...(existingCache?.mailbox?.threads ?? [])].sort((a, b) =>
          a.emailsUpdatedAt < b.emailsUpdatedAt ? 1 : -1
        );

        return {
          ...existingCache,
          mailbox: {
            ...existingCache?.mailbox,
            threads: addedThreads,
            pageInfo: {
              cursor: existingCache?.mailbox?.pageInfo.cursor ?? null,
              hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
            }
          }
        };
      }
    );
  });
}

export function updateUserLabelsOnCreateOrEdit(
  cache: ApolloCache<any>,
  modifiedLabel: UserLabel | null | undefined,
  errors?: readonly GraphQLError[]
) {
  if (errors) {
    console.error('There was an error creating or modifying label', errors);
    return;
  }

  if (!modifiedLabel) {
    console.log('No modified label returned from server');
    return;
  }

  cache.updateQuery<UserLabelsQuery>({ query: UserLabelsDocument }, (existing) => ({
    ...existing,
    userLabels: [
      ...(existing?.userLabels.filter((label) => label.labelID !== modifiedLabel.labelID) ?? []),
      modifiedLabel
    ]
  }));

  // Update the label in every cached thread that contains it
  Object.values(SystemLabels).forEach((label: string) => {
    cache.updateQuery<MailboxQuery>(
      {
        query: MailboxDocument,
        variables: { request: { label } }
      },
      (existingCache) => ({
        ...existingCache,
        mailbox: {
          ...existingCache?.mailbox,
          threads: (existingCache?.mailbox?.threads ?? []).map((thread) => {
            if (!thread.attributes.userLabels.some((userLabel) => userLabel.labelID === modifiedLabel.labelID)) {
              return thread;
            }
            return {
              ...thread,
              attributes: {
                ...thread.attributes,
                userLabels: thread.attributes.userLabels
                  .filter((ul) => ul.labelID !== modifiedLabel.labelID)
                  .concat(modifiedLabel)
              }
            };
          }),
          pageInfo: {
            cursor: existingCache?.mailbox?.pageInfo.cursor ?? null,
            hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
          }
        }
      })
    );
  });
}

export function removeUserLabelFromCache(cache: ApolloCache<any>, labelID: string) {
  if (!labelID) {
    console.error('No label ID to remove provided');
    return;
  }

  cache.updateQuery<UserLabelsQuery>({ query: UserLabelsDocument }, (existing) => ({
    ...existing,
    userLabels: [...(existing?.userLabels.filter((label) => label.labelID !== labelID) ?? [])]
  }));

  // Remove the label from cached threads that contain it
  forEach(Object.values(SystemLabels), (label: string) => {
    cache.updateQuery<MailboxQuery>(
      {
        query: MailboxDocument,
        variables: { request: { label } }
      },
      (existingCache) => ({
        ...existingCache,
        mailbox: {
          ...existingCache?.mailbox,
          threads: (existingCache?.mailbox?.threads ?? []).map((thread) => ({
            ...thread,
            attributes: {
              ...thread.attributes,
              userLabels: thread.attributes.userLabels.filter((ul) => ul.labelID !== labelID)
            }
          })),
          pageInfo: {
            cursor: existingCache?.mailbox?.pageInfo.cursor ?? null,
            hasNextPage: existingCache?.mailbox?.pageInfo.hasNextPage || false
          }
        }
      })
    );
  });
}

export function useGetCachedThreads(threadIDs: string[]): ThreadFragment[] {
  const client = useApolloClient();
  const cacheIDs = threadIDs.map((threadID) => client.cache.identify({ __typename: 'UserThread', threadID }));
  const threadFragments = cacheIDs.map((cacheID) =>
    client.cache.readFragment<ThreadFragment>({ id: cacheID, fragment: ThreadFragmentDoc, fragmentName: 'Thread' })
  );
  return threadFragments.filter(filterExists) as ThreadFragment[];
}

export function useGetCachedSelectedThreads(): ThreadFragment[] {
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  return useGetCachedThreads(selectedThreadIDs);
}
