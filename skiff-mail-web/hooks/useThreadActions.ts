import { Icon } from '@skiff-org/skiff-ui';
import { isString, lowerCase } from 'lodash';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';

import { SystemLabels, useApplyLabelsMutation, useRemoveLabelsMutation } from '../generated/graphql';
import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import { updateThreadsWithModifiedLabels } from '../utils/cache';
import { SystemLabel, UserLabel } from '../utils/label';
import { useAppSelector } from './redux/useAppSelector';
import useCustomSnackbar from './useCustomSnackbar';
import { useDrafts } from './useDrafts';

export function useThreadActions() {
  const router = useRouter();
  const { deleteDraft } = useDrafts();
  const [applyLabels, { error: applyLabelError }] = useApplyLabelsMutation();
  const [removeLabels] = useRemoveLabelsMutation();
  const { enqueueCustomSnackbar } = useCustomSnackbar();
  const dispatch = useDispatch();
  const setSelectedThreadIDs = (selectedThreadIDs: string[]) =>
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs }));
  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  const activeThreadID = isString(router.query.threadID) ? router.query.threadID : undefined;
  const activeEmailID = isString(router.query.emailID) ? router.query.emailID : undefined;

  const setActiveThreadID = (thread?: { threadID: string; emailID?: string }) => {
    if (!thread) {
      delete router.query.threadID;
      delete router.query.emailID;
      void router.replace({ pathname: router.pathname, query: router.query }, undefined, { shallow: true });
    } else {
      const query = thread.emailID
        ? { threadID: thread.threadID, emailID: thread.emailID }
        : { threadID: thread.threadID };
      void router.replace({ pathname: router.pathname, query: { ...router.query, ...query } });
    }
  };

  const trashThreads = async (threadIDs: string[], isDrafts: boolean, hideSnackbar = false) => {
    if (isDrafts) {
      threadIDs.forEach((draftID) => {
        void deleteDraft(draftID);
      });
    } else {
      await applyLabels({
        variables: {
          request: {
            threadIDs,
            systemLabels: [SystemLabels.Trash]
          }
        },
        update: (cache, response) =>
          updateThreadsWithModifiedLabels({
            cache,
            updatedThreads: response.data?.applyLabels?.updatedThreads,
            errors: response.errors
          })
      });
    }
    // Unselect threads if selected
    setSelectedThreadIDs(selectedThreadIDs.filter((threadID) => !threadIDs.includes(threadID)));
    // Clear active thread if it was trashed
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }
    if (!hideSnackbar) {
      const notificationSubject = `${
        threadIDs.length > 1
          ? `${threadIDs.length} ${isDrafts ? 'drafts' : 'threads'}`
          : `${isDrafts ? 'Draft' : 'Thread'}`
      }`;
      const notificationPredicate = `${isDrafts ? 'deleted' : 'moved to trash'}`;
      enqueueCustomSnackbar({
        body: `${notificationSubject} ${notificationPredicate}`,
        icon: Icon.Trash
      });
    }
  };

  const undoTrashThreads = async (threadIDs: string[], hideSnackbar = false) => {
    // Unselect thread if selected
    setSelectedThreadIDs(selectedThreadIDs.filter((threadID) => !threadIDs.includes(threadID)));

    const { errors } = await removeLabels({
      variables: {
        request: {
          threadIDs,
          systemLabels: [SystemLabels.Trash]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.removeLabels?.updatedThreads,
          errors: response.errors
        })
    });

    // Clear active thread if it was moved
    if (activeThreadID && threadIDs.includes(activeThreadID)) {
      setActiveThreadID(undefined);
    }

    if (errors) {
      console.error(errors);
      enqueueCustomSnackbar({
        body: 'Failed to remove thread from trash',
        icon: Icon.Warning
      });
    } else if (!hideSnackbar) {
      enqueueCustomSnackbar({
        body: 'Thread removed from trash',
        icon: Icon.Undo
      });
    }
  };

  const applyUserLabel = async (threadIDs: string[], userLabel: UserLabel) => {
    await applyLabels({
      variables: {
        request: {
          threadIDs,
          userLabels: [userLabel.value]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        })
    });

    if (applyLabelError) {
      enqueueCustomSnackbar({
        body: `Could not apply ${userLabel.name} label to thread`,
        icon: Icon.Warning
      });
    } else {
      enqueueCustomSnackbar({
        body: `${userLabel.name} label applied to thread`
      });
    }
  };

  const moveThreads = async (threadIDs: string[], systemLabel: SystemLabel, isDrafts: boolean, isTrash: boolean) => {
    if (systemLabel.value === SystemLabels.Trash) return trashThreads(threadIDs, isDrafts);

    if (isTrash) {
      // 2nd arg hides the snackbar so we don't show both 'Removed from trash' and 'Moved to <label>' snackbars
      await undoTrashThreads(threadIDs, true);
    }

    await applyLabels({
      variables: {
        request: {
          threadIDs,
          systemLabels: [systemLabel.value as SystemLabels]
        }
      },
      update: (cache, response) =>
        updateThreadsWithModifiedLabels({
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
      enqueueCustomSnackbar({
        body: `Could not move ${lowerCase(notificationSubject)} to ${systemLabel.name}. Please try again`,
        icon: Icon.Warning
      });
    } else {
      // Unselect threads if selected
      setSelectedThreadIDs(selectedThreadIDs.filter((threadID) => !threadIDs.includes(threadID)));
      const body = `${notificationSubject} moved to ${systemLabel.name}`;
      enqueueCustomSnackbar({
        body,
        icon: systemLabel.icon
      });
    }
  };

  return {
    applyUserLabel,
    trashThreads,
    undoTrashThreads,
    moveThreads,
    activeThreadID,
    activeEmailID,
    setActiveThreadID
  };
}
