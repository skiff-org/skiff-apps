import { saveAs } from 'file-saver';
import chunk from 'lodash/chunk';
import isString from 'lodash/isString';
import lowerCase from 'lodash/lowerCase';
import sortedUniqBy from 'lodash/sortedUniqBy';
import startCase from 'lodash/startCase';
import uniq from 'lodash/uniq';
import pluralize from 'pluralize';
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
  useBulkApplyLabelsMutation,
  useBulkDeleteTrashedThreadsMutation,
  useBulkRemoveLabelsMutation,
  useDeleteThreadMutation,
  useRemoveLabelsMutation,
  useSubscriptionPlan,
  GetThreadsFromIDsDocument,
  GetThreadsFromIDsQuery,
  GetThreadsFromIDsQueryVariables
} from 'skiff-front-graphql';
import {
  useToast,
  useCurrentUserData,
  isReactNativeDesktopApp,
  sendRNWebviewMsg,
  getRawMime,
  useUserPreference
} from 'skiff-front-utils';
import { BulkModifyLabelsRequest, SystemLabels, UserLabel, getTierNameFromSubscriptionPlan } from 'skiff-graphql';
import { StorageTypes, filterExists, getMaxNumLabelsOrFolders } from 'skiff-utils';

import client from '../apollo/client';
import { ThreadNavigationIDs } from '../components/Thread/Thread.types';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import { skemailSearchReducer } from '../redux/reducers/searchReducer';
import {
  modifyLabelsOptimizedResponseHandler,
  removeThreadsFromCache,
  updateThreadsWithModifiedLabels
} from '../utils/cache/cache';
import { createExportableEML } from '../utils/exportEml';
import {
  HiddenLabel,
  HiddenLabels,
  LabelType,
  ModifyLabelsActions,
  UserLabelPlain as ReactUserLabel,
  SystemLabel,
  UserLabelFolder,
  isFolder,
  userLabelToGraphQL
} from '../utils/label';
import { getSearchParams, replaceURL, updateURL } from '../utils/locationUtils';

import { useAppSelector } from './redux/useAppSelector';
import { useCurrentLabel } from './useCurrentLabel';
import { useDrafts } from './useDrafts';
import { usePlanDelinquency } from './usePlanDelinquency';

export interface ThreadActionResponse {
  completed: boolean;
  bulkJobID?: string;
}

// Maximum number of threads that can be exported in one zip
const MAX_EXPORTED_THREADS = 5000;

// response type for apply label or move to folder thread actions
export interface ApplyLabelOrFolderResponse extends ThreadActionResponse {
  rejectedForDelinquency?: boolean;
}
/**
 * Thread Actions
 * @param ignoreActive when true, will not get current label (which uses next router) in order to not re-render on route change
 * in addition to not using useAppSelector to get activeThreadID changes
 */
export function useThreadActions(ignoreActive?: boolean) {
  const [isAutoAdvanceOn] = useUserPreference(StorageTypes.AUTO_ADVANCE);
  const [advanceToNext] = useUserPreference(StorageTypes.ADVANCE_TO_NEXT);

  const { deleteDraft } = useDrafts();
  const userData = useCurrentUserData();
  const [applyLabels, { error: applyLabelError }] = useApplyLabelsMutation();
  const [bulkApplyLabels] = useBulkApplyLabelsMutation();
  const [deleteThread, { error: deleteThreadError }] = useDeleteThreadMutation();
  const [bulkDeleteTrashedThreads] = useBulkDeleteTrashedThreadsMutation();
  const [removeLabels, { error: removeLabelError }] = useRemoveLabelsMutation();
  const [bulkRemoveLabels] = useBulkRemoveLabelsMutation();
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
  const { label: storedLabel } = useCurrentLabel();
  const currentLabel = ignoreActive ? undefined : storedLabel;
  const isUserLabel = !!currentLabel && !Object.values<string>(SystemLabels).includes(currentLabel);
  // no need to append hash to system label mailbox url's
  // hashes used for disambiguating between user label urls via e.g. /label#[userLabelHash]
  const userLabel = isUserLabel ? currentLabel : undefined;

  const isInImports = currentLabel === SystemLabels.Imports;
  const isInQuickAliases = currentLabel === SystemLabels.QuickAliases;
  const isInSearch = currentLabel === HiddenLabels.Search;

  const { nextActiveThreadID, prevActiveThreadID } = useAppSelector((state) => state.mailbox);
  const { activeThreadID, activeEmailID } = useAppSelector((state) => {
    if (ignoreActive) return {};
    // We return the search active thread data if we're on the search page
    // and the mailbox active thread data otherwise
    if (isInSearch) {
      const activeThread = state.search.activeThread;
      return activeThread ? { activeThreadID: activeThread.threadID, activeEmailID: activeThread.emailID } : {};
    }
    return state.mailbox.activeThread;
  });

  // ignoreSearch param can be used, e.g., when set setActiveThread coincides with leaving search route
  const setActiveThreadID = (thread?: ThreadNavigationIDs, ignoreSearch?: boolean) => {
    const threadID = isString(thread?.threadID) ? thread?.threadID : undefined;
    const emailID = isString(thread?.emailID) ? thread?.emailID : undefined;

    if (isInSearch && !ignoreSearch) {
      // We don't add the active thread id to the url in search;
      // so we keep track via redux
      const activeSearchThread = threadID
        ? {
            threadID,
            emailID
          }
        : undefined;
      dispatch(skemailSearchReducer.actions.setActiveThread(activeSearchThread));
      return;
    }

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

  // Handles closing the active thread after applying thread actions
  // Auto-advances to the next/prev thread if necessary
  const handleCloseActiveThread = (effectiveThreadIDs: string[]) => {
    const hasActiveThread = !!activeThreadID && effectiveThreadIDs.includes(activeThreadID);
    // Do nothing if the active thread was not amongst the threads that were moved
    // or if the user is in the Imports / Quick aliases / Search page, where thread actions do not actually move the threads
    if (!hasActiveThread || isInImports || isInQuickAliases || isInSearch) return;

    if (isAutoAdvanceOn) {
      // If auto-advance is enabled, advance to the next/prev thread
      const newActiveThreadID = advanceToNext ? nextActiveThreadID : prevActiveThreadID;
      if (!!newActiveThreadID) {
        setActiveThreadID({ threadID: newActiveThreadID });
        return;
      }
    }

    // If auto-advance is disabled or if there's no thread to advance to,
    // close the active thread
    setActiveThreadID(undefined);
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

  const enqueueBulkModifyLabelsJob = async (
    request: BulkModifyLabelsRequest,
    modifyLabelsAction: ModifyLabelsActions
  ) => {
    const arg = {
      variables: { request }
    };
    if (modifyLabelsAction === ModifyLabelsActions.APPLY) {
      const { data } = await bulkApplyLabels(arg);
      return data?.bulkApplyLabels?.jobID;
    } else {
      const { data } = await bulkRemoveLabels(arg);
      return data?.bulkRemoveLabels?.jobID;
    }
  };

  const deleteThreads = async (
    threadIDs: string[],
    hideToast = false,
    // bulk delete all threads in trash
    shouldBulkDeleteTrashedThreads = false
  ): Promise<ThreadActionResponse> => {
    let bulkJobID: string | undefined;

    const enqueueErrorToast = () =>
      enqueueToast({
        title: 'Deletion failed',
        body: `Could not delete ${pluralize('email', threadIDs.length)}. Please try again.`
      });

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
      // bulk requests are tagged onto the initial mutation that modifies cache and
      // gives immediate feedback
      if (shouldBulkDeleteTrashedThreads) {
        const { data } = await bulkDeleteTrashedThreads();
        bulkJobID = data?.bulkDeleteTrashedThreads?.jobID;
      }
    } catch (e) {
      console.error(e);
      enqueueErrorToast();
      return { completed: false };
    }

    if (deleteThreadError) {
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }

    // Unselect threads if selected;
    // defer to after bulk request finishes
    if (!shouldBulkDeleteTrashedThreads) unselectThreads(threadIDs);

    handleCloseActiveThread(threadIDs);

    if (!hideToast) {
      // toast is hidden for bulk actions, so thread count will be accurate in this notificaiotn
      const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;
      enqueueToast({
        title: `Permanently deleted`,
        body: `${notificationSubject} removed from the trash forever.`
      });
    }
    return { bulkJobID, completed: !shouldBulkDeleteTrashedThreads };
  };

  const trashThreads = async (
    threadIDs: string[],
    isDrafts: boolean,
    hideToast = false,
    label = 'Inbox',
    bulkRequest?: BulkModifyLabelsRequest,
    // selectedThreadIDs may differ from the threadIDs being modified in cases
    // where some selected threads have already undergone the requested mutation; possible e.g. in search results
    selectedThreadIDs?: string[]
  ): Promise<ThreadActionResponse> => {
    const displayLabel = startCase(label.toLowerCase());
    let bulkJobID: string | undefined;
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

      try {
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
        });
        // bulk requests are tagged onto the initial mutation that modifies cache and
        // gives immediate feedback
        if (bulkRequest) {
          bulkJobID = await enqueueBulkModifyLabelsJob(bulkRequest, ModifyLabelsActions.APPLY);
        }
      } catch (e) {
        console.error(e);
        enqueueToast({
          title: 'Failed to trash emails',
          body: `Could not remove emails from ${displayLabel}.`
        });
        return { completed: false };
      }
    }
    // Unselect threads if selected;
    // defer to after bulk request finishes
    if (!bulkRequest) unselectThreads(selectedThreadIDs || threadIDs);

    handleCloseActiveThread(threadIDs);

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
        body: `${notificationSubject} removed from ${displayLabel}`
      });
    }
    return { bulkJobID, completed: !bulkRequest };
  };

  const archiveThreads = async (
    threadIDs: string[],
    hideToast = false,
    bulkRequest?: BulkModifyLabelsRequest,
    // selectedThreadIDs may differ from the threadIDs being modified in cases
    // where some selected threads have already undergone the requested mutation; possible e.g. in search results
    selectedThreadIDs?: string[]
  ): Promise<ThreadActionResponse> => {
    let bulkJobID: string | undefined;
    const onArchiveUserLabelMerger = (cachedLabels: UserLabel[]) => cachedLabels;

    const onArchiveSystemLabelMerger = (cachedLabels: SystemLabels[]) => cachedLabels.concat([SystemLabels.Archive]);

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      onArchiveUserLabelMerger,
      onArchiveSystemLabelMerger,
      ModifyLabelsActions.APPLY
    );

    try {
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
      // bulk requests are tagged onto the initial mutation that modifies cache and
      // gives immediate feedback
      if (bulkRequest) {
        bulkJobID = await enqueueBulkModifyLabelsJob(bulkRequest, ModifyLabelsActions.APPLY);
      }
    } catch (e) {
      console.error(e);
      enqueueToast({
        title: 'Failed to archive emails',
        body: 'Could not delete emails from the mailbox.'
      });
      return { completed: false };
    }
    // Unselect threads if selected
    // defer to after bulk request finishes
    if (!bulkRequest) unselectThreads(selectedThreadIDs || threadIDs);

    handleCloseActiveThread(threadIDs);

    if (!hideToast) {
      const notificationSubject = `${threadIDs.length > 1 ? 'Threads' : 'Thread'}`;
      enqueueToast({
        title: `Archived`,
        body: `${notificationSubject} removed from inbox.`
      });
    }
    return { bulkJobID, completed: !bulkRequest };
  };

  const removeUserLabel = async (
    threadIDs: string[],
    labelsToRemove: ReactUserLabel[],
    hideToast = false,
    bulkRequest?: BulkModifyLabelsRequest
  ): Promise<ThreadActionResponse> => {
    let bulkJobID: string | undefined;
    const labelNamesToRemove = labelsToRemove.map((label) => label.name);

    const userLabelMerger = (cachedLabels: UserLabel[]) =>
      cachedLabels.filter((label) => !labelNamesToRemove.includes(label.labelName));

    const systemLabelsMerger = (cachedLabels: SystemLabels[]) => cachedLabels;

    const optimisticResponseHandler = modifyLabelsOptimizedResponseHandler(
      userLabelMerger,
      systemLabelsMerger,
      ModifyLabelsActions.REMOVE
    );

    const enqueueErrorToast = () =>
      enqueueToast({
        title: 'Failed to update labels',
        body:
          labelsToRemove.length >= 2
            ? 'Could not remove labels from thread'
            : `Could not remove ${labelsToRemove[0]?.name ?? ''} label from thread`
      });

    try {
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
      // bulk requests are tagged onto the initial mutation that modifies cache and
      // gives immediate feedback
      if (bulkRequest) {
        bulkJobID = await enqueueBulkModifyLabelsJob(bulkRequest, ModifyLabelsActions.REMOVE);
      }
    } catch (e) {
      console.error(e);
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }

    if (removeLabelError) {
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }
    return { bulkJobID, completed: !bulkRequest };
  };

  const applyUserLabel = async (
    threadIDs: string[],
    labelsToAdd: ReactUserLabel[],
    hideToast = false,
    bulkRequest?: BulkModifyLabelsRequest
  ): Promise<ApplyLabelOrFolderResponse> => {
    let bulkJobID: string | undefined;
    // don't allow user to apply labels if they have more than their plan allows
    if (
      canEnforceDelinquency &&
      downgradeProgress?.userLabels &&
      downgradeProgress.userLabels > maxNumLabelsOrFolders
    ) {
      openPlanDelinquencyModal();
      return { completed: false, rejectedForDelinquency: true };
    }
    const enqueueErrorToast = () =>
      enqueueToast({
        title: 'Failed to update labels',
        body:
          labelsToAdd.length >= 2
            ? 'Could not apply labels to thread'
            : `Could not apply ${labelsToAdd[0]?.name ?? ''} label to thread`
      });
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
    try {
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
      if (bulkRequest) {
        bulkJobID = await enqueueBulkModifyLabelsJob(bulkRequest, ModifyLabelsActions.APPLY);
      }
    } catch (e) {
      console.error(e);
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }

    if (applyLabelError) {
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }
    return { bulkJobID, completed: !bulkRequest };
  };

  const moveThreads = async (
    threadIDs: string[],
    label: SystemLabel | UserLabelFolder | HiddenLabel,
    currentSystemLabels: string[], // array of strings representing the current system labels
    hideToast = false,
    bulkRequest?: BulkModifyLabelsRequest,
    // selectedThreadIDs may differ from the threadIDs being modified in cases
    // where some selected threads have already undergone the requested mutation; possible e.g. in search results
    selectedThreadIDs?: string[]
  ): Promise<ApplyLabelOrFolderResponse> => {
    let bulkJobID: string | undefined;
    // don't allow user to move thread to a custom folder if they have more than their plan allows
    const isUserFolder = label.type === LabelType.USER;
    if (
      isUserFolder &&
      canEnforceDelinquency &&
      downgradeProgress?.userFolders &&
      downgradeProgress.userFolders > maxNumLabelsOrFolders
    ) {
      openPlanDelinquencyModal();
      return { completed: false, rejectedForDelinquency: true };
    }
    const isDrafts = currentSystemLabels.includes(SystemLabels.Drafts);

    if (label.value === SystemLabels.Trash) {
      return trashThreads(
        threadIDs,
        isDrafts,
        !!bulkRequest,
        currentLabel ?? undefined,
        bulkRequest,
        selectedThreadIDs
      );
    }
    // Only allow dragging drafts to trash
    if (isDrafts) return { completed: false };

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

    const notificationSubject = `${threadIDs.length > 1 ? `${threadIDs.length} threads` : 'Thread'}`;

    const enqueueErrorToast = () =>
      enqueueToast({
        title: 'Move failed',
        body: `Could not move ${lowerCase(notificationSubject)} to ${label.name}. Please try again.`
      });

    try {
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
      if (bulkRequest) {
        bulkJobID = await enqueueBulkModifyLabelsJob(
          {
            targetLabel: bulkRequest.targetLabel,
            systemLabels: systemLabelToAdd,
            userLabels: userLabelToAdd
          },
          ModifyLabelsActions.APPLY
        );
      }
    } catch (e) {
      console.error(e);
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    }

    if (applyLabelError) {
      if (!hideToast) enqueueErrorToast();
      return { completed: false };
    } else {
      // Unselect threads if selected
      // defer to after bulk request finishes
      if (!bulkRequest) unselectThreads(selectedThreadIDs || threadIDs);
      handleCloseActiveThread(threadIDs);
      if (!hideToast) {
        const body = `${notificationSubject} moved to ${label.name}`;
        enqueueToast({
          title: 'Email moved',
          body
        });
      }
      return { bulkJobID, completed: !bulkRequest };
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
        title: 'Email moved to drafts',
        body: `Your message has been moved to your drafts.`
      });
    }
  };

  const downloadThreads = async (selectedThreadIDs: string[]) => {
    if (selectedThreadIDs.length > MAX_EXPORTED_THREADS) {
      enqueueToast({
        title: `Can only export up to ${MAX_EXPORTED_THREADS} threads`,
        body: 'Please select fewer threads to export.'
      });
      return;
    }
    // can only download 50 threads at a time
    const threadIDChunks = chunk(selectedThreadIDs, 5);
    enqueueToast({
      title: `Export starting`,
      body: `Exporting ${selectedThreadIDs.length} ${pluralize('thread', selectedThreadIDs.length)}...`
    });
    // Fetch threads in parallel for each chunk
    const downloadedThreadsArray = await Promise.all(
      threadIDChunks.map((curChunk) => {
        return client.query<GetThreadsFromIDsQuery, GetThreadsFromIDsQueryVariables>({
          query: GetThreadsFromIDsDocument,
          variables: {
            threadIDs: curChunk
          }
        });
      })
    );
    const allThreadDataArrays = downloadedThreadsArray.map((threads) => threads.data?.userThreads ?? []);
    const allDownloadedThreads = allThreadDataArrays.flatMap((threads) => threads);
    // Flatten the resulting threads array
    const allEmailsFlatMap = allDownloadedThreads.flatMap((thread) => thread.emails);
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
    const mimePromises = allThreadURLs.map(async (urlData) => {
      const { url, decryptedSessionKey, date } = urlData;
      const rawMime = await getRawMime(url, decryptedSessionKey);
      if (!rawMime) return;
      zip.file(`${date.getTime()}.eml`, rawMime);
    });
    const emlPromises = allEmailsFlatMap
      .map(async (emailInfo) => {
        const { encryptedRawMimeUrl } = emailInfo;
        if (encryptedRawMimeUrl || !userData) {
          return undefined;
        }
        const emlInfo = (await createExportableEML(userData, emailInfo)) as string;
        if (!emlInfo) {
          return;
        }
        const zipTitle = typeof emailInfo.createdAt === 'object' ? emailInfo.createdAt.getTime() : emailInfo.createdAt;
        zip.file(`${zipTitle}.eml`, emlInfo);
      })
      .filter(filterExists);
    await Promise.all([...mimePromises, ...emlPromises]);
    const blob = await zip.generateAsync({ type: 'blob' });
    if (isReactNativeDesktopApp()) {
      const base64Data = await blob.arrayBuffer().then((buffer) => Buffer.from(buffer).toString('base64'));
      sendRNWebviewMsg('saveFile', {
        base64Data,
        type: 'application/zip',
        filename: 'Skiff Mail - export.zip'
      });
      return;
    }
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
