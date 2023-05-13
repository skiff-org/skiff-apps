import { ApolloCache, useApolloClient } from '@apollo/client';
import { NormalizedCacheObject } from '@apollo/client/cache';
import { GraphQLError } from 'graphql';
import difference from 'lodash/difference';
import forEach from 'lodash/forEach';
import {
  ApplyLabelsMutation,
  GetNumUnreadDocument,
  RemoveLabelsMutation,
  ThreadWithoutContentFragment,
  ThreadWithoutContentFragmentDoc
} from 'skiff-front-graphql';
import {
  MailboxDocument,
  MailboxQuery,
  MailboxQueryVariables,
  ThreadFragment,
  UserLabelsDocument,
  UserLabelsQuery
} from 'skiff-front-graphql';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import { UpdatedThreadLabels, UserLabel } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { possibleMailboxFilters } from '../../redux/reducers/mailboxReducer';
import { ModifyLabelsActions } from '../label';

import { addThreadsToMailboxQuery, removeThreadsFromMailboxQuery } from './mailbox';

/**
 * Updates the unread count of the given labels wth their paired unread diff, in the given cache
 * @param cache cache to read and update
 * @param diffByLabelMap a map of label and unread diff (for this label's unread counter) pairs
 */
export function updateLabelsNumUnreadCache(
  cache: ApolloCache<NormalizedCacheObject>,
  diffByLabelMap: Map<string, number>
): void {
  diffByLabelMap.forEach((unreadDiff, label) => {
    cache.updateQuery(
      { id: cache.identify({ __typename: 'Query' }), query: GetNumUnreadDocument, variables: { label } },
      (existingNumUnread) => {
        if (!existingNumUnread) return null;
        return {
          unread: existingNumUnread.unread + unreadDiff
        };
      }
    );
  });
}

/**
 * General optimistic response handler for modifying labels
 * @param userLabelsMergeFunction modifies user labels
 * @param systemLabelsMergeFunction modifies system labels
 */
export function modifyLabelsOptimizedResponseHandler(
  userLabelsMergeFunction: (exsisting: UserLabel[]) => UserLabel[],
  systemLabelsMergeFunction: (existing: SystemLabels[]) => SystemLabels[],
  action: ModifyLabelsActions
): (cachedThreads: ThreadFragment[]) => ApplyLabelsMutation | RemoveLabelsMutation | undefined {
  return (cachedThreads) => {
    const populatedCachedThreads = cachedThreads.filter((thread) => !!thread);
    if (!populatedCachedThreads.length) return;

    return {
      [action]: {
        updatedThreads: populatedCachedThreads.map((cachedThread) => ({
          threadID: cachedThread.threadID,
          userLabels: userLabelsMergeFunction(cachedThread.attributes.userLabels),
          systemLabels: systemLabelsMergeFunction(cachedThread.attributes.systemLabels as SystemLabels[]),
          __typename: 'UpdatedThreadLabels'
        })),
        __typename: 'ModifyLabelsResponse'
      }
    };
  };
}

// Remove permanently deleted threads from the cache.
export function removeThreadsFromCache(params: {
  cache: ApolloCache<any>;
  threadIDs: string[];
  label: SystemLabels;
  errors?: readonly GraphQLError[];
}) {
  const { cache, threadIDs, errors, label } = params;
  if (errors) {
    console.error('There was an error applying labels', errors);
    return;
  }

  const fragments = threadIDs
    .map((threadID) => {
      const cacheID = cache.identify({ __typename: 'UserThread', threadID });

      return cache.readFragment<ThreadWithoutContentFragment>({
        id: cacheID,
        fragment: ThreadWithoutContentFragmentDoc,
        fragmentName: 'ThreadWithoutContent'
      });
    })
    .filter(filterExists);

  const diffMap = { [SystemLabels.Trash]: fragments.filter((fragment) => !fragment.attributes.read).length * -1 };
  updateLabelsNumUnreadCache(cache, new Map(Object.entries(diffMap)));

  // Permanently deleted threads must already be in trash, so we just need to remove trash label.
  removeThreadsFromMailboxQuery(cache, label, fragments);
}

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

  const threadsToRemoveByLabel: Map<string, ThreadWithoutContentFragment[]> = new Map();
  const threadsToAddByLabel: Map<string, ThreadWithoutContentFragment[]> = new Map();

  const unreadMap: Map<string, number> = new Map();

  if (!updatedThreads?.length) return;

  // Parse through updatedThreads to determine labels to add/remove
  for (const thread of updatedThreads) {
    const threadID = thread.threadID;
    const cacheID = cache.identify({ __typename: 'UserThread', threadID });
    if (cacheID) {
      cache.updateFragment<ThreadWithoutContentFragment>(
        { id: cacheID, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' },
        (existing) => {
          if (!existing) {
            return null;
          }

          const existingLabels = [
            ...(existing.attributes.systemLabels ?? []),
            ...(existing.attributes.userLabels.map((userLabel) => userLabel.labelID) ?? [])
          ];
          const updatedLabels = [...thread.systemLabels, ...thread.userLabels.map((userLabel) => userLabel.labelID)];

          const wasInAFolder = existing.attributes.userLabels.some(
            (label) => label.variant === UserLabelVariant.Folder
          );
          const addedToFolder =
            !wasInAFolder && thread.userLabels.some((label) => label.variant === UserLabelVariant.Folder);
          const removedFromFolder =
            wasInAFolder && thread.userLabels.every((label) => label.variant !== UserLabelVariant.Folder);

          // In a standard case, we'll just add/remove the difference between them
          let labelsToRemoveThreadFrom = difference(existingLabels, updatedLabels);
          let labelsToAddThreadTo = difference(updatedLabels, existingLabels);

          /* Special case: Folder */
          // If where adding to a folder, remove from other SystemLabels
          if (addedToFolder) {
            labelsToRemoveThreadFrom = [...labelsToRemoveThreadFrom, ...existing.attributes.systemLabels];
            // If where adding to a folder, remove from other SystemLabels
          } else if (removedFromFolder) {
            labelsToAddThreadTo = [...labelsToAddThreadTo, ...existing.attributes.systemLabels];
          }

          /* Special case: Trash and Archive */
          // If we're adding trash, we remove the thread from all other labels and only add it to trash or
          if (labelsToAddThreadTo.includes(SystemLabels.Trash)) {
            labelsToRemoveThreadFrom = existingLabels;
            labelsToAddThreadTo = [SystemLabels.Trash];
          }
          // If we're adding archive, we remove the thread from all other labels and only add it to archive
          else if (labelsToAddThreadTo.includes(SystemLabels.Archive)) {
            labelsToRemoveThreadFrom = existingLabels;
            labelsToAddThreadTo = [SystemLabels.Archive];
            // If we're removing from trash or archive, we want to now add this thread back to all other labels its now part of
          } else if (
            labelsToRemoveThreadFrom.includes(SystemLabels.Trash) ||
            labelsToRemoveThreadFrom.includes(SystemLabels.Archive)
          ) {
            labelsToAddThreadTo = updatedLabels;
          }

          const updatedThreadFragment: ThreadWithoutContentFragment = {
            ...existing,
            attributes: {
              ...existing.attributes,
              systemLabels: thread.systemLabels,
              userLabels: thread.userLabels
            }
          };

          // Labels to remove
          for (const labelToRemove of labelsToRemoveThreadFrom) {
            const currentThreadsToRemove = threadsToRemoveByLabel.get(labelToRemove) ?? [];
            threadsToRemoveByLabel.set(labelToRemove, [...currentThreadsToRemove, updatedThreadFragment]);
          }

          // Labels to add
          for (const labelToAdd of labelsToAddThreadTo) {
            const currentThreadsToAdd = threadsToAddByLabel.get(labelToAdd) ?? [];
            threadsToAddByLabel.set(labelToAdd, [...currentThreadsToAdd, updatedThreadFragment]);
          }

          return updatedThreadFragment;
        }
      );
    }
  }

  // For each label, remove all threads that have been marked for removal
  threadsToRemoveByLabel.forEach((threadsToRemove, label) => {
    removeThreadsFromMailboxQuery(cache, label, threadsToRemove);
    // update unread count if needed (can only decrease by removal)
    const diffToAdd = threadsToRemove.reduce(
      (totalDiff, currentThread) => (totalDiff -= currentThread.attributes.read ? 0 : 1),
      unreadMap.get(label) || 0
    );

    const currentUnreadCount = unreadMap.get(label) ?? 0;

    unreadMap.set(label, diffToAdd + currentUnreadCount);
  });

  // For each label, add all threads that have been marked for add
  threadsToAddByLabel.forEach((threadsToAdd, label) => {
    addThreadsToMailboxQuery(cache, label, threadsToAdd);
    // update unread count if needed (can only increase by addition)
    const diffToAdd = threadsToAdd.reduce(
      (totalDiff, currentThread) => (totalDiff += currentThread.attributes.read ? 0 : 1),
      0
    );

    const currentUnreadCount = unreadMap.get(label) ?? 0;

    unreadMap.set(label, diffToAdd + currentUnreadCount);
  });

  updateLabelsNumUnreadCache(cache, unreadMap);
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
    possibleMailboxFilters.forEach((filter) => {
      cache.updateQuery<MailboxQuery, MailboxQueryVariables>(
        {
          query: MailboxDocument,
          variables: { request: { label, filters: filter } }
        },
        (existing) => {
          if (!existing?.mailbox) {
            return null;
          }
          return {
            ...existing,
            mailbox: {
              ...existing.mailbox,
              threads: existing.mailbox.threads.map((thread) => {
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
              })
            }
          };
        }
      );
    });
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

export function useGetCachedThreads(threadIDs: string[]): ThreadWithoutContentFragment[] {
  const client = useApolloClient();
  const cacheIDs = threadIDs.map((threadID) => client.cache.identify({ __typename: 'UserThread', threadID }));
  const threadFragments = cacheIDs.map((cacheID) =>
    client.cache.readFragment<ThreadWithoutContentFragment>(
      { id: cacheID, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' },
      true
    )
  );
  return threadFragments.filter(filterExists);
}

export function useGetCachedSelectedThreads(): ThreadWithoutContentFragment[] {
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  return useGetCachedThreads(selectedThreadIDs);
}
