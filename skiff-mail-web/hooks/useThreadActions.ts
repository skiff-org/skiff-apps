import { saveAs } from 'file-saver';
import isString from 'lodash/isString';
import lowerCase from 'lodash/lowerCase';
import sortedUniqBy from 'lodash/sortedUniqBy';
import uniq from 'lodash/uniq';
import { useDispatch } from 'react-redux';
import {
  ApplyLabelsMutation,
  RemoveLabelsMutation,
  ThreadFragment,
  ThreadWithoutContentFragmentDoc,
  UnsendMessageDocument,
  UnsendMessageMutation,
  UnsendMessageMutationVariables,
  useApplyLabelsMutation,
  useDeleteThreadMutation,
  useRemoveLabelsMutation,
  useSubscriptionPlan
} from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';
import { getTierNameFromSubscriptionPlan, SystemLabels } from 'skiff-graphql';
import { UserLabel } from 'skiff-graphql';
import { filterExists, getMaxNumLabelsOrFolders } from 'skiff-utils';

import client from '../apollo/client';
import { ThreadNavigationIDs } from '../components/Thread/Thread.types';
import { MailboxThreadInfo } from '../models/thread';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import {
  modifyLabelsOptimizedResponseHandler as modifyLabelsOptimizedResponseHandler,
  removeThreadsFromCache,
  updateThreadsWithModifiedLabels
} from '../utils/cache/cache';
import { getRawMime } from '../utils/eml';
import {
  isFolder,
  ModifyLabelsActions,
  SystemLabel,
  UserLabelFolder,
  userLabelToGraphQL,
  UserLabelPlain as ReactUserLabel,
  HiddenLabel,
  LabelType,
  ApplyLabelOrFolderResponse
} from '../utils/label';
import { getSearchParams, replaceURL, updateURL } from '../utils/locationUtils';

import { useAppSelector } from './redux/useAppSelector';
import { useCurrentLabel } from './useCurrentLabel';
import { useDrafts } from './useDrafts';
import { usePlanDelinquency } from './usePlanDelinquency';

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
  const { isUserPaidUp, downgradeProgress, openPlanDelinquencyModal } = usePlanDelinquency();
  const {
    loading: activeSubscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const canEnforceDelinquency = !isUserPaidUp && !activeSubscriptionLoading;
  const userTier = getTierNameFromSubscriptionPlan(activeSubscription);
  const maxNumLabelsOrFolders = getMaxNumLabelsOrFolders(userTier);
  const { enqueueToast } = useToast();
  const dispatch = useDispatch();
  const unselectThreads = (threadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.removeSelectedThreadID(threadIDs));
  // Ignore active hooks
  // While these are conditional hooks that technically could break
  // will never happen because ignoreActive will never change
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { label: storedLabel } = useCurrentLabel();
  const currentLabel = ignoreActive ? undefined : storedLabel;
  const isUserLabel = !!currentLabel && !Object.values<string>(SystemLabels).includes(currentLabel);
  // no need to append hash to system label mailbox url's
  // hashes used for disambiguating between user label urls via e.g. /label#[userLabelHash]
  const userLabel = isUserLabel ? currentLabel : undefined;
  const { activeThreadID, activeEmailID } = ignoreActive
    ? { activeThreadID: undefined, activeEmailID: undefined }
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useAppSelector((state) => state.mailbox.activeThread);

  const setActiveThreadID = (thread?: ThreadNavigationIDs) => {
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
      client.cache.readFragment({ id, fragment: ThreadWithoutContentFragmentDoc, fragmentName: 'ThreadWithoutContent' })
    );

    return handler(cachedItems as unknown as ThreadFragment[]);
  };

  const deleteThreads = async (threadIDs: string[], hideToast = false, clearActiveThreadID = true) => {
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
      if (activeThreadID && threadIDs.includes(activeThreadID) && clearActiveThreadID) {
        setActiveThreadID(undefined);
      }
      if (!hideToast) {
        const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;
        enqueueToast({
          title: `Permanently deleted`,
          body: `${notificationSubject} removed from the trash forever.`
        });
      }
    } catch (e) {
      console.error(e);
      enqueueToast({
        title: 'Failed to remove thread',
        body: 'Could delete thread from the inbox.'
      });
    }
  };

  const trashThreads = async (
    threadIDs: string[],
    isDrafts: boolean,
    hideToast = false,
    clearActiveThreadID = true
  ) => {
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
          updateThreadsWithModifiedLabels({
            cache,
            updatedThreads: response.data?.applyLabels?.updatedThreads,
            errors: response.errors
          })
      }).catch((e) => {
        console.error(e);
        enqueueToast({
          title: 'Failed to remove thread',
          body: 'Could delete thread from the inbox.'
        });
      });
    }
    // Unselect threads if selected
    unselectThreads(threadIDs);
    // Clear active thread if it was trashed
    if (activeThreadID && threadIDs.includes(activeThreadID) && clearActiveThreadID) {
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
        title: `${notificationSubject} ${notificationPredicate}`,
        body: `${notificationSubject} removed from inbox`
      });
    }
  };

  const archiveThreads = async (threadIDs: string[], hideToast = false, clearActiveThreadID = true) => {
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
    if (activeThreadID && threadIDs.includes(activeThreadID) && clearActiveThreadID) {
      setActiveThreadID(undefined);
    }
    if (!hideToast) {
      const notificationSubject = `${threadIDs.length > 1 ? 'Threads' : 'Thread'}`;
      enqueueToast({
        title: `Archived`,
        body: `${notificationSubject} removed from inbox.`
      });
    }
  };

  const removeThreadFromFolder = (threadIDs: string[]) => {
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
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.removeLabels?.updatedThreads,
          errors: response.errors
        });
      }
    });

    if (removeLabelError) {
      enqueueToast({
        title: 'Failed to update labels',
        body:
          labelsToRemove.length >= 2
            ? 'Could not remove labels from thread'
            : `Could not remove ${labelsToRemove[0]?.name ?? ''} label from thread`
      });
    }
  };

  const applyUserLabel = async (
    threadIDs: string[],
    labelsToAdd: ReactUserLabel[]
  ): Promise<ApplyLabelOrFolderResponse> => {
    // don't allow user to apply labels if they have more than their plan allows
    if (
      canEnforceDelinquency &&
      downgradeProgress?.userLabels &&
      downgradeProgress.userLabels > maxNumLabelsOrFolders
    ) {
      openPlanDelinquencyModal();
      return { rejectedForDelinquency: true };
    }
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
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });

    if (applyLabelError) {
      enqueueToast({
        title: 'Failed to update labels',
        body:
          labelsToAdd.length >= 2
            ? 'Could not apply labels to thread'
            : `Could not apply ${labelsToAdd[0]?.name ?? ''} label to thread`
      });
    }
    return {};
  };

  const moveThreads = async (
    threadIDs: string[],
    label: SystemLabel | UserLabelFolder | HiddenLabel,
    currentSystemLabels: string[], // array of strings representing the current system labels
    clearActiveThreadID = true
  ): Promise<ApplyLabelOrFolderResponse> => {
    // don't allow user to move thread to a custom folder if they have more than their plan allows
    const isUserFolder = label.type === LabelType.USER;
    if (
      isUserFolder &&
      canEnforceDelinquency &&
      downgradeProgress?.userFolders &&
      downgradeProgress.userFolders > maxNumLabelsOrFolders
    ) {
      openPlanDelinquencyModal();
      return { rejectedForDelinquency: true };
    }
    const isDrafts = currentSystemLabels.includes(SystemLabels.Drafts);
    removeThreadFromFolder(threadIDs);

    if (label.value === SystemLabels.Trash) {
      void trashThreads(threadIDs, isDrafts);
      return {};
    }
    // Only allow dragging drafts to trash
    if (isDrafts) return {};

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
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });

    // Clear active thread if it was moved
    if (activeThreadID && threadIDs.includes(activeThreadID) && clearActiveThreadID) {
      setActiveThreadID(undefined);
    }

    const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;

    if (applyLabelError) {
      enqueueToast({
        title: 'Move failed',
        body: `Could not move ${lowerCase(notificationSubject)} to ${label.name}. Please try again`
      });
    } else {
      // Unselect threads if selected
      unselectThreads(threadIDs);
      const body = `${notificationSubject} moved to ${label.name}`;
      enqueueToast({
        title: 'Email moved',
        body
      });
    }
    return {};
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
        title: 'Email unscheduled',
        body: `Message returned to drafts.`
      });
    }
  };

  const downloadThreads = async (selectedThreadIDs: string[], allThreads: MailboxThreadInfo[]) => {
    const threads = allThreads.filter((thread) => selectedThreadIDs.includes(thread.threadID));
    const allEmailsFlatMap = threads.flatMap((thread) => thread.emails);
    const allThreadURLs = allEmailsFlatMap
      .map((email) => {
        const { encryptedRawMimeUrl: url, decryptedSessionKey } = email;
        if (!url || !decryptedSessionKey) {
          return undefined;
        }
        return { date: email.createdAt, url, decryptedSessionKey };
      })
      .filter(filterExists);
    // create zip and download all URLs
    const { default: JSZIP } = await import('jszip');
    const zip = new JSZIP();
    const promises = allThreadURLs.map(async (urlData) => {
      const { url, decryptedSessionKey, date } = urlData;
      const rawMime = await getRawMime(url, decryptedSessionKey);
      if (!rawMime) return;
      zip.file(`${date.getTime()}.eml`, rawMime);
    });
    await Promise.all(promises);
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'Skiff Mail - export.zip');
  };

  return {
    applyUserLabel,
    removeUserLabel,
    trashThreads,
    moveThreads,
    downloadThreads,
    activeThreadID,
    activeEmailID,
    setActiveThreadID,
    archiveThreads,
    deleteThreads,
    unscheduleSend
  };
}
