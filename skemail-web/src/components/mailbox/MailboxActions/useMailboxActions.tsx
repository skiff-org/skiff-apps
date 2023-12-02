import { Icon } from 'nightwatch-ui';
import { MouseEvent, useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useGetBulkActionJobStatusQuery, useGetNumMailboxThreadsQuery } from 'skiff-front-graphql';
import { ActionIcon, usePrevious, useToast } from 'skiff-front-utils';
import { BulkActionVariant, SystemLabels } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useIsFullScreenThreadOpen } from '../../../hooks/useIsFullScreenThreadOpen';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useSyncSelectedThreads } from '../../../hooks/useSyncSelectedThreads';
import { ThreadActionResponse, useThreadActions, ApplyLabelOrFolderResponse } from '../../../hooks/useThreadActions';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailHotKeysReducer } from '../../../redux/reducers/hotkeysReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { HiddenLabels, LABEL_TO_SYSTEM_LABEL, UserLabelFolder, UserLabelPlain } from '../../../utils/label';
import {
  BulkAction,
  MailboxActionInfo,
  getBulkActionVariant,
  getSuccessMessage,
  MailboxMultiSelectFilter
} from '../../../utils/mailboxActionUtils';
import { markAllThreadsAsRead } from '../../../utils/mailboxUtils';
import TooltipWithShortcut from '../../shared/TooltipWithShortcut/TooltipWithShortcut';

const BULK_JOB_STATUS_POLL_INTERVAL_MS = 1000;

export const MailboxActionsDataTest = {
  moveToTrashIcon: 'move-to-trash-icon',
  undoTrashIcon: 'undo-trash-icon'
};

const LABEL_ID = 'add-label';
const FOLDER_ID = 'move-folder';

interface UseMailboxActionsProps {
  // selected threads
  threads: MailboxThreadInfo[];
  // path label
  label: string;
  // Clear the lastSelectedIndex state used for multi-select in mailbox
  clearLastSelectedIndex: () => void;
  // force refetch messages; not necessary in search route
  onRefresh?: () => Promise<void>;
  // return ID for label and move dropdowns
  withID?: boolean;
}

export const useMailboxActionsRefs = () => {
  const labelRef = useRef<HTMLDivElement | null>(null);
  const folderRef = useRef<HTMLDivElement | null>(null);

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const someThreadsAreSelected = selectedThreadIDs.length > 0;

  useEffect(() => {
    const fetchElements = () => {
      const labelElement = document.getElementById(LABEL_ID);
      const folderElement = document.getElementById(FOLDER_ID);

      if (labelElement) {
        labelRef.current = labelElement as HTMLDivElement;
      }

      if (folderElement) {
        folderRef.current = folderElement as HTMLDivElement;
      }
    };

    // Introduce a short delay to ensure correct element is fetched from DOM
    const timer = setTimeout(fetchElements, 100); // 100ms delay, adjust as needed

    return () => clearTimeout(timer);
  }, [someThreadsAreSelected]);

  return { labelRef, folderRef };
};

interface UseMailboxActionsReturn {
  mailboxActions: ActionIcon[];
  shouldConfirmSelectedOrAllThreads: boolean;
  mailboxActionOnSuccess: (successMessage: string) => void;
  handleArchiveThreads: (bulk?: boolean) => Promise<ThreadActionResponse>;
  handleTrashThreads: (bulk?: boolean) => Promise<ThreadActionResponse>;
  handlePermDeleteThreads: (bulk?: boolean) => Promise<ThreadActionResponse>;
  handleApplyUserLabel: (labelToApply: UserLabelPlain, bulk?: boolean) => Promise<ApplyLabelOrFolderResponse>;
  handleRemoveUserLabel: (labelToRemove: UserLabelPlain, bulk?: boolean) => Promise<ThreadActionResponse>;
  handleMoveToUserFolder: (destinationFolder: UserLabelFolder, bulk?: boolean) => Promise<ApplyLabelOrFolderResponse>;
  handleMoveToInbox: (bulk?: boolean) => Promise<ApplyLabelOrFolderResponse>;
  handleToggleRead: (bulk?: boolean) => Promise<ThreadActionResponse>;
}

export const useMailboxActions = ({
  threads,
  label,
  clearLastSelectedIndex,
  onRefresh,
  withID
}: UseMailboxActionsProps): UseMailboxActionsReturn => {
  /** State */
  const isFullScreenThreadOpen = useIsFullScreenThreadOpen();

  const { markThreadsAsReadUnread } = useMarkAsReadUnread();

  // multi-select filter state
  const multiSelectFilter = useAppSelector((state) => state.mailbox.multiSelectFilter);
  // quick alias filter; applicable only to "Quick Aliases" mailbox
  const quickAliasFilter = useAppSelector((state) => state.mailbox.quickAliasFilter);

  const { data: numThreadsUnderLabelData, refetch } = useGetNumMailboxThreadsQuery({
    variables: {
      label
    },
    skip: label === HiddenLabels.Search
  });

  const numThreadsUnderLabel = numThreadsUnderLabelData?.numMailboxThreads ?? 0;

  useSyncSelectedThreads(threads, multiSelectFilter);
  /** Redux */
  const dispatch = useDispatch();
  const setPendingMailboxAction = useCallback(
    (mailboxActionInfo: MailboxActionInfo | undefined) => {
      dispatch(skemailMailboxReducer.actions.setPendingMailboxAction(mailboxActionInfo));
    },
    [dispatch]
  );

  const clearInProgressBulkAction = useCallback(() => {
    dispatch(skemailMailboxReducer.actions.setInProgressBulkAction(undefined));
  }, [dispatch]);

  const clearBulkActionState = useCallback(() => {
    clearInProgressBulkAction();
    setPendingMailboxAction(undefined);
  }, [clearInProgressBulkAction, setPendingMailboxAction]);

  const finishInProgressBulkAction = useCallback(() => {
    dispatch(skemailMailboxReducer.actions.finishInProgressBulkAction());
  }, [dispatch]);

  const setSelectedThreadIDs = useCallback(
    (selectedThreadIDs: string[]) =>
      dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs })),
    [dispatch]
  );

  const setSelectFilter = useCallback(
    (newFilter: MailboxMultiSelectFilter | undefined) => {
      dispatch(skemailMailboxReducer.actions.setMultiSelectFilter(newFilter));
    },
    [dispatch]
  );

  const inProgressBulkAction = useAppSelector((state) => state.mailbox.inProgressBulkAction);
  const inProgressBulkJobID = inProgressBulkAction?.bulkJobID;
  const inProgressBulkActionType = inProgressBulkAction?.bulkAction.type;
  const inProgressBulkActionIsFinishing = inProgressBulkAction?.isFinishing;
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const someThreadsAreSelected = selectedThreadIDs.length > 0;

  const {
    data: bulkActionJobStatusData,
    startPolling,
    stopPolling
  } = useGetBulkActionJobStatusQuery({
    variables: {
      request: {
        jobID: inProgressBulkJobID ?? '',
        bulkActionVariant: inProgressBulkActionType
          ? getBulkActionVariant(inProgressBulkActionType)
          : // unused fallback; query will be skipped if no inProgressBulkActionType
            BulkActionVariant.ModifyLabels
      }
    },
    skip: !inProgressBulkJobID || !inProgressBulkActionType
  });
  const isBulkActionComplete = !!bulkActionJobStatusData?.bulkActionJobStatus.completed;

  const { moveThreads, archiveThreads, trashThreads, deleteThreads, downloadThreads, applyUserLabel, removeUserLabel } =
    useThreadActions();

  const { enqueueToast } = useToast();

  let allTrash = false,
    allArchive = false,
    allInbox = false,
    allSpam = false,
    containsDrafts = false;

  const isSearch = label === HiddenLabels.Search;
  if (isSearch) {
    allTrash = selectedThreadIDs.every((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Trash)
    );
    allArchive = selectedThreadIDs.every((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Archive)
    );
    allInbox = selectedThreadIDs.every((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Inbox)
    );
    allSpam = selectedThreadIDs.every((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Spam)
    );
    containsDrafts = selectedThreadIDs.some((thread) =>
      threads.find((t) => t.threadID === thread)?.attributes.systemLabels.includes(SystemLabels.Drafts)
    );
  }
  const isDrafts = label === SystemLabels.Drafts || containsDrafts;
  const isTrash = label === SystemLabels.Trash || allTrash;
  const isArchive = label === SystemLabels.Archive || allArchive;
  const isInbox = label === SystemLabels.Inbox || allInbox;
  const isSpam = label === SystemLabels.Spam || allSpam;
  const isScheduleSend = label === SystemLabels.ScheduleSend;

  const clearSelectionState = useCallback(() => {
    setSelectFilter(undefined);
    setSelectedThreadIDs([]);
    clearLastSelectedIndex();
    setPendingMailboxAction(undefined);
  }, [setSelectedThreadIDs, clearLastSelectedIndex, setSelectFilter, setPendingMailboxAction]);

  // clear selected threads when label changes
  useEffect(() => {
    clearSelectionState();
  }, [label, clearSelectionState]);

  // clear state when user changes to full-screen thread context
  useEffect(() => {
    if (isFullScreenThreadOpen && someThreadsAreSelected) {
      clearSelectionState();
    }
  }, [isFullScreenThreadOpen, someThreadsAreSelected, clearSelectionState]);

  // refetch bulk thread count on label change or thread changes
  useEffect(() => {
    void refetch();
  }, [label, threads.length, refetch]);

  // refresh mailbox state after a thread action, bulk or not, is completed via the bulk action confirm modal
  const mailboxActionOnSuccess = useCallback(
    (successMessage: string) => {
      // stop progress indicators but don't clear the bulk action entirely
      // until refresh has completed to ensure smooth transition to resulting threads
      finishInProgressBulkAction();
      if (onRefresh) {
        void onRefresh().then(() => {
          clearBulkActionState();
        });
      } else {
        clearBulkActionState();
      }
      enqueueToast({
        title: 'Success!',
        body: successMessage
      });
    },
    [clearBulkActionState, onRefresh, enqueueToast, finishInProgressBulkAction]
  );

  const previousInProgressBulkActionType = usePrevious(inProgressBulkActionType);
  const previousIsBulkActionComplete = usePrevious(isBulkActionComplete);

  // when a new bulk action begins, poll for its completion
  useEffect(() => {
    if (inProgressBulkActionIsFinishing) return;
    if (inProgressBulkActionType) {
      if (!isBulkActionComplete) {
        startPolling(BULK_JOB_STATUS_POLL_INTERVAL_MS);
      } else {
        // bulk action completed
        stopPolling();
        mailboxActionOnSuccess(getSuccessMessage(inProgressBulkActionType, true));
      }
    } else if (previousInProgressBulkActionType && !previousIsBulkActionComplete) {
      // if inProgressBulkAction ever changes from non-null to null without having completed,
      // ensure polling stops
      stopPolling();
    }
    return () => stopPolling();
  }, [
    isBulkActionComplete,
    inProgressBulkActionType,
    inProgressBulkActionIsFinishing,
    previousIsBulkActionComplete,
    previousInProgressBulkActionType,
    startPolling,
    stopPolling,
    mailboxActionOnSuccess
  ]);

  const allRenderedThreadsAreSelected = selectedThreadIDs.length === threads.length;
  // whether the total number of threads under this label are currently rendered and selected; true of small mailboxes
  const allThreadsUnderLabelAreSelected = selectedThreadIDs.length === numThreadsUnderLabel;
  // whether the entirety of threads in this mailbox are rendered
  const allThreadsUnderLabelAreRendered = threads.length === numThreadsUnderLabel;
  // give user the option to perform action on selected threads versus whole mailbox
  const shouldConfirmSelectedOrAllThreads =
    // bulk actions are not yet supported in search route
    !isSearch &&
    // bulk actions don't yet support a subset of user labels, so we only support
    // "Quick Aliases" mailbox if there is no filter applied (meaning user intends to apply action to entire Quick Alias mailbox)
    !quickAliasFilter &&
    //only allow one bulk action request at a time
    !inProgressBulkActionType &&
    // we do not yet support filtered bulk actions, e.g. do something to all threads that have a file,
    // so we only offer bulk action if the user has selected all rendered threads in a non-filtered state
    (multiSelectFilter === MailboxMultiSelectFilter.ALL || !multiSelectFilter) &&
    allRenderedThreadsAreSelected &&
    !allThreadsUnderLabelAreSelected;
  const someSelectedAreUnread = selectedThreadIDs.some(
    (thread) => threads.find((t) => t.threadID === thread)?.attributes.read === false
  );
  const selectedThreads = threads.filter((thread) => selectedThreadIDs.includes(thread.threadID));

  const allRenderedThreadIDs = threads.map((thread) => thread.threadID);

  // The below handlers can be used to directly execute a mailbox action without mediating it through a standard mailbox action
  // toolbar or dropdown that embeds these actions in icons; useful e.g. when executing a bulk mailbox action via a confirm modal

  const handlePermDeleteThreads = (bulk?: boolean) => {
    // a bulk perm delete request for which we need not disambiguate
    // can only have originated from the single-purpose "empty trash" button in MailboxHeader
    const isEmptyingTrash = bulk && !shouldConfirmSelectedOrAllThreads;
    if (isEmptyingTrash) {
      // when emptying trash, a user is only given the bulk option, but we don't actually
      // execute the bulk mutation unless there are enough threads to necessitate it
      return deleteThreads(allRenderedThreadIDs, true, !allThreadsUnderLabelAreRendered);
    } else {
      return deleteThreads(selectedThreadIDs, shouldConfirmSelectedOrAllThreads, bulk);
    }
  };

  const handleTrashThreads = (bulk?: boolean): Promise<ThreadActionResponse> => {
    return trashThreads(
      selectedThreadIDs.filter(
        (threadID) =>
          !threads.find((t) => t.threadID === threadID)?.attributes.systemLabels.includes(SystemLabels.Trash)
      ),
      isDrafts,
      shouldConfirmSelectedOrAllThreads,
      label,
      bulk ? { targetLabel: label, systemLabels: [SystemLabels.Trash] } : undefined,
      selectedThreadIDs
    );
  };

  const handleArchiveThreads = (bulk?: boolean): Promise<ThreadActionResponse> => {
    return archiveThreads(
      selectedThreadIDs.filter(
        (threadID) =>
          !threads.find((t) => t.threadID === threadID)?.attributes.systemLabels.includes(SystemLabels.Archive)
      ),
      shouldConfirmSelectedOrAllThreads,
      bulk ? { targetLabel: label, systemLabels: [SystemLabels.Archive] } : undefined,
      selectedThreadIDs
    );
  };

  const handleApplyUserLabel = (labelToApply: UserLabelPlain, bulk?: boolean) => {
    return applyUserLabel(
      selectedThreadIDs.filter(
        (threadID) =>
          !threads
            .find((t) => t.threadID === threadID)
            ?.attributes.userLabels.some((userLabel) => userLabel.labelID === labelToApply.value)
      ),
      [labelToApply],
      shouldConfirmSelectedOrAllThreads,
      bulk ? { targetLabel: label, userLabels: [labelToApply.value] } : undefined
    );
  };

  const handleRemoveUserLabel = (labelToRemove: UserLabelPlain, bulk?: boolean) => {
    return removeUserLabel(
      selectedThreadIDs.filter((threadID) =>
        threads
          .find((t) => t.threadID === threadID)
          ?.attributes.userLabels.some((userLabel) => userLabel.labelID === labelToRemove.value)
      ),
      [labelToRemove],
      shouldConfirmSelectedOrAllThreads,
      bulk ? { targetLabel: label, userLabels: [labelToRemove.value] } : undefined
    );
  };

  const handleMoveToUserFolder = (destinationFolder: UserLabelFolder, bulk?: boolean) => {
    return moveThreads(
      selectedThreadIDs.filter(
        (threadID) =>
          !threads
            .find((t) => t.threadID === threadID)
            ?.attributes.userLabels.some((folder) => folder.labelID === destinationFolder.value)
      ),
      destinationFolder,
      [label],
      shouldConfirmSelectedOrAllThreads,
      bulk ? { targetLabel: label, userLabels: [destinationFolder.value] } : undefined,
      selectedThreadIDs
    );
  };

  const handleMoveToInbox = (bulk?: boolean) => {
    return moveThreads(
      selectedThreadIDs.filter(
        (threadID) =>
          !threads.find((t) => t.threadID === threadID)?.attributes.systemLabels.includes(SystemLabels.Inbox)
      ),
      LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox],
      [label],
      shouldConfirmSelectedOrAllThreads,
      bulk ? { targetLabel: label, systemLabels: [SystemLabels.Inbox] } : undefined,
      selectedThreadIDs
    );
  };

  const handleToggleRead = async (bulk?: boolean): Promise<ThreadActionResponse> => {
    markThreadsAsReadUnread(selectedThreads, someSelectedAreUnread);
    if (bulk) {
      try {
        await markAllThreadsAsRead(someSelectedAreUnread, label);
      } catch (e) {
        console.error(e);
        return { completed: false };
      }
    }
    return { completed: true };
  };

  const markReadUnreadAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (shouldConfirmSelectedOrAllThreads) {
      setPendingMailboxAction({
        type: BulkAction.TOGGLE_READ,
        resultingReadState: someSelectedAreUnread,
        originLabelValue: label
      });
    } else {
      markThreadsAsReadUnread(selectedThreads, someSelectedAreUnread);
    }
  };

  const modifyLabelAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    dispatch(skemailHotKeysReducer.actions.setMailboxLabelsDropdownOpen());
  };

  const moveFolderAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    dispatch(skemailHotKeysReducer.actions.setMailboxMoveFolderDropdownOpen());
  };

  const permDeleteAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (shouldConfirmSelectedOrAllThreads) {
      setPendingMailboxAction({
        type: BulkAction.PERMANENTLY_DELETE,
        originLabelValue: label
      });
    } else {
      void handlePermDeleteThreads();
      clearLastSelectedIndex();
    }
  };
  const reportSpamAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Spam], [label]);
    clearLastSelectedIndex();
  };

  const exportAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    void downloadThreads(selectedThreadIDs);
    clearLastSelectedIndex();
  };

  const moveToInboxAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (shouldConfirmSelectedOrAllThreads) {
      setPendingMailboxAction({
        type: BulkAction.MOVE_TO_INBOX,
        originLabelValue: label
      });
    } else {
      void moveThreads(selectedThreadIDs, LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
      clearLastSelectedIndex();
    }
  };
  const archiveAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (shouldConfirmSelectedOrAllThreads) {
      setPendingMailboxAction({ type: BulkAction.ARCHIVE, originLabelValue: label });
    } else {
      void handleArchiveThreads().then(() => {
        if (onRefresh) {
          void onRefresh();
        }
      });
      clearLastSelectedIndex();
    }
  };
  const trashAction = (e?: MouseEvent) => {
    e?.stopPropagation();
    if (shouldConfirmSelectedOrAllThreads) {
      setPendingMailboxAction({ type: BulkAction.TRASH, originLabelValue: label });
    } else {
      void handleTrashThreads().then(() => {
        if (onRefresh) {
          void onRefresh();
        }
      });
      clearLastSelectedIndex();
    }
  };

  const showReadUnread = !isDrafts;
  const showModifyLabel = !isDrafts;
  const showMoveFolder = !isDrafts;
  const showPermDelete = !isDrafts && isTrash;
  const showReportSpam = !isDrafts && !isSpam && !isScheduleSend;
  const showExport = !isDrafts;
  const showNotSpam = !isDrafts && isSpam;
  const showArchive = !isTrash && !isArchive && !isDrafts && !isScheduleSend;
  const showTrash = !isTrash && !isScheduleSend;

  const showMoveToInbox = (isTrash || isArchive) && !isInbox;

  const mailboxActions: ActionIcon[] = [
    ...insertIf(showReadUnread, {
      icon: someSelectedAreUnread ? Icon.EnvelopeRead : Icon.EnvelopeUnread,
      onClick: markReadUnreadAction,
      label: someSelectedAreUnread ? 'Mark as read' : 'Mark as unread',
      key: 'read',
      tooltip: someSelectedAreUnread ? 'Mark as read' : 'Mark as unread'
    }),
    ...insertIf(showModifyLabel, {
      icon: Icon.Tag,
      onClick: modifyLabelAction,
      label: 'Add label',
      id: withID ? LABEL_ID : undefined,
      key: 'label',
      tooltip: <TooltipWithShortcut label='Labels' shortcut='L' />
    }),
    ...insertIf(showMoveFolder, {
      icon: Icon.FolderArrow,
      onClick: moveFolderAction,
      label: 'Move to',
      id: withID ? FOLDER_ID : undefined,
      tooltip: 'Move to',
      key: 'move-folder'
    }),
    ...insertIf(showPermDelete, {
      icon: Icon.Trash,
      onClick: permDeleteAction,
      label: 'Trash',
      tooltip: 'Permanently delete',
      key: 'perm-delete'
    }),
    ...insertIf(showReportSpam, {
      icon: Icon.Spam,
      onClick: reportSpamAction,
      label: 'Report spam',
      tooltip: 'Report spam',
      key: 'spam'
    }),
    ...insertIf(showExport, {
      icon: Icon.Download,
      onClick: exportAction,
      label: 'Export',
      tooltip: 'Export',
      key: 'export'
    }),
    ...insertIf(showNotSpam, {
      icon: Icon.MoveMailbox,
      onClick: moveToInboxAction,
      label: 'Not spam',
      tooltip: 'Not spam',
      key: 'not-spam'
    }),
    ...insertIf(showArchive, {
      icon: Icon.Archive,
      onClick: archiveAction,
      label: 'Archive',
      tooltip: <TooltipWithShortcut label='Archive' shortcut='E' />,
      key: 'archive'
    }),
    ...insertIf(showMoveToInbox, {
      icon: Icon.MoveMailbox,
      onClick: moveToInboxAction,
      label: 'Move to inbox',
      tooltip: <TooltipWithShortcut label='Move to inbox' shortcut='Z' />,
      key: 'move-inbox',
      dataTest: MailboxActionsDataTest.undoTrashIcon
    }),
    ...insertIf(showTrash, {
      icon: Icon.Trash,
      onClick: trashAction,
      label: 'Trash',
      tooltip: <TooltipWithShortcut label='Trash' shortcut='#' />,
      key: 'trash',
      dataTest: MailboxActionsDataTest.moveToTrashIcon
    })
  ];

  return {
    mailboxActions,
    shouldConfirmSelectedOrAllThreads,
    mailboxActionOnSuccess,
    handleArchiveThreads,
    handleTrashThreads,
    handlePermDeleteThreads,
    handleApplyUserLabel,
    handleRemoveUserLabel,
    handleMoveToInbox,
    handleMoveToUserFolder,
    handleToggleRead
  };
};
