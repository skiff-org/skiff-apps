import { isString, lowerCase, sortedUniqBy, uniq } from 'lodash';
import { Icon } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { UserLabel } from 'skiff-graphql';
import {
  ApplyLabelsMutation,
  RemoveLabelsMutation,
  ThreadFragment,
  ThreadFragmentDoc,
  UnsendMessageDocument,
  UnsendMessageMutation,
  UnsendMessageMutationVariables,
  useApplyLabelsMutation,
  useDeleteThreadMutation,
  useRemoveLabelsMutation
} from 'skiff-mail-graphql';

import client from '../apollo/client';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import {
  modifyLabelsOptimizedResponseHandler as modifyLabelsOptimizedResponseHandler,
  removeThreadsFromCache,
  updateThreadsWithModifiedLabels
} from '../utils/cache/cache';
import {
  isFolder,
  ModifyLabelsActions,
  SystemLabel,
  UserLabelFolder,
  userLabelToGraphQL,
  UserLabel as ReactUserLabel
} from '../utils/label';
import { getSearchParams, replaceURL, updateURL } from '../utils/locationUtils';

import { useAppSelector } from './redux/useAppSelector';
import { useCurrentLabel } from './useCurrentLabel';
import { useDrafts } from './useDrafts';

/**
 * Thread Actions
 * @param ignoreActive when true, will not get current label (which uses next router) in order to not re-render on route change
 * in addition to not using useAppSelector to get activeThreadID changes
 */
export function useThreadActions(ignoreActive?: boolean) {
  const { deleteDraft } = useDrafts();
  const [applyLabels, { error: applyLabelError }] = useApplyLabelsMutation();
  const [deleteThread] = useDeleteThreadMutation();
  const [removeLabels, { error: removeLabelError }] = useRemoveLabelsMutation();
  const { enqueueToast } = useToast();
  const dispatch = useDispatch();
  const unselectThreads = (threadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(threadIDs));
  // Ignore active hooks
  // While these are conditional hooks that technically could break
  // will never happen because ignoreActive will never change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const currentLabel = ignoreActive ? undefined : useCurrentLabel();
  const isUserLabel = !!currentLabel && !Object.values<string>(SystemLabels).includes(currentLabel);
  // no need to append hash to system label mailbox url's
  // hashes used for disambiguating between user label urls via e.g. /label#[userLabelHash]
  const userLabel = isUserLabel ? currentLabel : undefined;
  const { activeThreadID, activeEmailID } = ignoreActive
    ? { activeThreadID: undefined, activeEmailID: undefined }
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useAppSelector((state) => state.mailbox.activeThread);

  const setActiveThreadID = (thread?: { threadID: string; emailID?: string }) => {
    const threadID = isString(thread?.threadID) ? thread?.threadID : undefined;
    const emailID = isString(thread?.emailID) ? thread?.emailID : undefined;
    let query = getSearchParams();
    if (emailID && threadID) query = { ...query, emailID, threadID };
    else delete query.emailID;
    if (threadID) query = { ...query, threadID };
    else delete query.threadID;
    updateURL(replaceURL({ query, hash: userLabel || undefined }));
    dispatch(
      skemailMailboxReducer.actions.setActiveThread({
        activeThreadID: threadID,
        activeEmailID: emailID
      })
    );
  };

  /**
   * reads cache for given threads IDs, then returns a call for handler passing it the cached items
   * @param threadsIDs an array of queries to read from cache
   * @param handler a callback that receives the cached items and calculates and returns the optimistic response
   */
  const optimisticResponseWithCacheThreads = (
    threadsIDs: string[],
    handler: (cachedThreads: ThreadFragment[]) => ApplyLabelsMutation | RemoveLabelsMutation | undefined
  ): ApplyLabelsMutation | RemoveLabelsMutation | undefined => {
    const cacheIDs = threadsIDs.map((threadID) => client.cache.identify({ threadID, __typename: 'UserThread' }));
    const cachedItems = cacheIDs.map((id) =>
      client.cache.readFragment({ id, fragment: ThreadFragmentDoc, fragmentName: 'Thread' })
    );

    return handler(cachedItems as unknown as ThreadFragment[]);
  };

  const deleteThreads = async (threadIDs: string[], hideToast = false) => {
    try {
      await deleteThread({
        variables: {
          request: {
            threadIDs
          }
        },
        optimisticResponse: {
          deleteThread: {
            threadIDs
          }
        },
        update: (cache, response) =>
          removeThreadsFromCache({
            cache,
            threadIDs,
            label: SystemLabels.Trash,
            errors: response.errors
          })
      });
      // Unselect threads if selected
      dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(threadIDs));
      // Clear active thread if it was  trashed
      if (activeThreadID && threadIDs.includes(activeThreadID)) {
        setActiveThreadID(undefined);
      }
      if (!hideToast) {
        const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;
        enqueueToast({
          body: `${notificationSubject} permanently deleted`,
          icon: Icon.Trash
        });
      }
    } catch (e) {
      console.error(e);
      enqueueToast({
        body: 'Failed to remove threads',
        icon: Icon.Warning
      });
    }
  };

  const trashThreads = async (threadIDs: string[], isDrafts: boolean, hideToast = false) => {
    if (isDrafts) {
      threadIDs.forEach((draftID) => {
        void deleteDraft(draftID);
      });
    } else {
      const onTrashUserLabelMerger = (cachedUserLabels: UserLabel[]) => cachedUserLabels;

      const onTrashSystemLabelMerger = (cachedLabels: SystemLabels[]) => cachedLabels.concat([SystemLabels.Trash]);

      const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
        onTrashUserLabelMerger,
        onTrashSystemLabelMerger,
        ModifyLabelsActions.APPLY
      );

      await applyLabels({
        variables: {
          request: {
            threadIDs,
            systemLabels: [SystemLabels.Trash]
          }
        },
        optimisticResponse: optimisticResponseWithCacheThreads(threadIDs, optimisticResponseHandler),
        update: (cache, response) =>
          void updateThreadsWithModifiedLabels({
            cache,
            updatedThreads: response.data?.applyLabels?.updatedThreads,
            errors: response.errors
          })
      }).catch((e) => {
        console.error(e);
        enqueueToast({
          body: 'Failed to remove thread',
          icon: Icon.Warning
        });
      });
    }
    // Unselect threads if selected
    unselectThreads(threadIDs);
    // Clear active thread if it was trashed
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }
    // TODO: set `trashedAt` field when it's available so that we permanently delete after 30 days
    if (!hideToast) {
      const notificationSubject = `${
        threadIDs.length > 1
          ? `${threadIDs.length} ${isDrafts ? 'drafts' : 'threads'}`
          : `${isDrafts ? 'Draft' : 'Thread'}`
      }`;
      const notificationPredicate = `${isDrafts ? 'deleted' : 'moved to trash'}`;
      enqueueToast({
        body: `${notificationSubject} ${notificationPredicate}`,
        icon: Icon.Trash
      });
    }
  };

  const archiveThreads = async (threadIDs: string[], hideToast = false) => {
    const onArchiveUserLabelMerger = (cachedLabels: UserLabel[]) => cachedLabels;

    const onArchiveSystemLabelMerger = (cachedLabels: SystemLabels[]) => cachedLabels.concat([SystemLabels.Archive]);

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      onArchiveUserLabelMerger,
      onArchiveSystemLabelMerger,
      ModifyLabelsActions.APPLY
    );

    await applyLabels({
      variables: {
        request: {
          threadIDs,
          systemLabels: [SystemLabels.Archive]
        }
      },
      optimisticResponse: optimisticResponseWithCacheThreads(threadIDs, optimisticResponseHandler),
      update: (cache, response) =>
        void updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });
    // Unselect threads if selected
    unselectThreads(threadIDs);
    // Clear active thread if it was trashed
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }
    if (!hideToast) {
      const notificationSubject = `${threadIDs.length > 1 ? 'Threads' : 'Thread'}`;
      enqueueToast({
        body: `${notificationSubject} archived`,
        icon: Icon.Archive
      });
    }
  };

  const removeThreadFromFolder = async (threadIDs: string[]) => {
    // Unselect thread if selected
    unselectThreads(threadIDs);
    // Clear active thread if it was moved
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }
  };

  const removeUserLabel = async (threadIDs: string[], labelsToRemove: ReactUserLabel[]) => {
    const labelNamesToRemove = labelsToRemove.map((label) => label.name);

    const userLabelMerger = (cachedLabels: UserLabel[]) =>
      cachedLabels.filter((label) => !labelNamesToRemove.includes(label.labelName));

    const systemLabelsMerger = (cachedLabels: SystemLabels[]) => cachedLabels;

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      userLabelMerger,
      systemLabelsMerger,
      ModifyLabelsActions.REMOVE
    );

    await removeLabels({
      variables: {
        request: {
          threadIDs,
          userLabels: labelsToRemove.map((label) => label.value)
        }
      },
      optimisticResponse: optimisticResponseWithCacheThreads(threadIDs, optimisticResponseHandler),
      update: (cache, response) => {
        return void updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.removeLabels?.updatedThreads,
          errors: response.errors
        });
      }
    });

    if (removeLabelError) {
      enqueueToast({
        body:
          labelsToRemove.length >= 2
            ? 'Could not remove labels from thread'
            : `Could not remove ${labelsToRemove[0].name} label from thread`,
        icon: Icon.Warning
      });
    }
  };

  const applyUserLabel = async (threadIDs: string[], labelsToAdd: ReactUserLabel[]) => {
    // removing duplications of labels (rare edge case)
    const userLabelMerger = (cachedLabels: UserLabel[]) =>
      sortedUniqBy(
        cachedLabels
          .concat(labelsToAdd.map(userLabelToGraphQL))
          .sort((labelA, labelB) => labelA.labelName.localeCompare(labelB.labelName)),
        (label) => label.labelID
      );

    const systemLabelsMerger = (cachedLabels: SystemLabels[]) => cachedLabels;

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      userLabelMerger,
      systemLabelsMerger,
      ModifyLabelsActions.APPLY
    );

    await applyLabels({
      variables: {
        request: {
          threadIDs,
          userLabels: labelsToAdd.map((label) => label.value)
        }
      },
      optimisticResponse: optimisticResponseWithCacheThreads(threadIDs, optimisticResponseHandler),

      update: (cache, response) =>
        void updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });

    if (applyLabelError) {
      enqueueToast({
        body:
          labelsToAdd.length >= 2
            ? 'Could not apply labels to thread'
            : `Could not apply ${labelsToAdd[0].name} label to thread`,
        icon: Icon.Warning
      });
    }
  };

  const moveThreads = async (
    threadIDs: string[],
    label: SystemLabel | UserLabelFolder,
    currentSystemLabels: string[] // array of strings representing the current system labels
  ) => {
    const isDrafts = currentSystemLabels.includes(SystemLabels.Drafts);
    await removeThreadFromFolder(threadIDs);

    if (label.value === SystemLabels.Trash) {
      return trashThreads(threadIDs, isDrafts);
    }
    // Only allow dragging drafts to trash
    if (isDrafts) return;

    const userLabelToAdd = isFolder(label) ? [label.value] : undefined;
    const userLabelToAddOptimistic = isFolder(label) ? [userLabelToGraphQL(label)] : [];
    const systemLabelToAdd = isFolder(label) ? undefined : [label.value as SystemLabels];
    const systemLabelToAddOptimistic = isFolder(label) ? [] : [label.value as SystemLabels];

    const onMoveUserLabelMerger = (cachedLabels: UserLabel[]) => cachedLabels.concat(userLabelToAddOptimistic);

    const onMoveSystemLabelsMerger = (cachedLabels: SystemLabels[]) =>
      uniq(cachedLabels.concat(systemLabelToAddOptimistic));

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      onMoveUserLabelMerger,
      onMoveSystemLabelsMerger,
      ModifyLabelsActions.APPLY
    );

    await applyLabels({
      variables: {
        request: {
          threadIDs,
          systemLabels: systemLabelToAdd,
          userLabels: userLabelToAdd
        }
      },
      optimisticResponse: optimisticResponseWithCacheThreads(threadIDs, optimisticResponseHandler),
      update: (cache, response) =>
        void updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });

    // Clear active thread if it was moved
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }

    const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;

    if (applyLabelError) {
      enqueueToast({
        body: `Could not move ${lowerCase(notificationSubject)} to ${label.name}. Please try again`,
        icon: Icon.Warning
      });
    } else {
      // Unselect threads if selected
      unselectThreads(threadIDs);
      const body = `${notificationSubject} moved to ${label.name}`;
      enqueueToast({
        body,
        icon: isFolder(label) ? Icon.Folder : label.icon
      });
    }
  };

  const unscheduleSend = async (threadID: string, scheduleMessageID: string, hideToast = false) => {
    await client.mutate<UnsendMessageMutation, UnsendMessageMutationVariables>({
      mutation: UnsendMessageDocument,
      variables: {
        request: {
          messageID: scheduleMessageID,
          threadID: threadID
        }
      },
      update: (cache, response) =>
        void removeThreadsFromCache({
          cache,
          threadIDs: [threadID],
          label: SystemLabels.ScheduleSend,
          errors: response.errors
        })
    });
    unselectThreads([threadID]);
    // Clear active thread if it was unscheduled
    if (activeThreadID && threadID == activeThreadID) {
      setActiveThreadID(undefined);
    }
    if (!hideToast) {
      enqueueToast({
        body: `Email unscheduled and returned to drafts.`,
        icon: Icon.FileEmpty
      });
    }
  };

  return {
    applyUserLabel,
    removeUserLabel,
    trashThreads,
    moveThreads,
    activeThreadID,
    activeEmailID,
    setActiveThreadID,
    archiveThreads,
    deleteThreads,
    unscheduleSend
  };
}
