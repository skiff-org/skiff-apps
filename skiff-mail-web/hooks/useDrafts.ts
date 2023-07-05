import * as IDB from 'idb-keyval';
import noop from 'lodash/noop';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { DraftInfo, useCreateOrUpdateDraftMutation, useDeleteDraftMutation } from 'skiff-front-graphql';
import { useDebouncedAsyncCallback, useCurrentUserData } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { ThreadAttributes } from 'skiff-graphql';
import { v4 as uuidv4, validate } from 'uuid';

import { MailboxEmailInfo, ThreadViewEmailInfo } from '../models/email';
import { MailboxThreadInfo } from '../models/thread';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { skemailModalReducer } from '../redux/reducers/modalReducer';
import store from '../redux/store/reduxStore';
import { getDraftIDBKey, getDraftSaveData, parseAndDecryptDraft } from '../utils/draftUtils';

import { useAppSelector } from './redux/useAppSelector';

const SAVE_DRAFT_DEBOUNCE_MS = 1000;

const newDraftThreadAttributes: ThreadAttributes = {
  read: true,
  systemLabels: [SystemLabels.Drafts],
  userLabels: []
};

export type MailDraftAttributes = Omit<DraftInfo, 'draftID' | 'createdAt'> & { composeIsDirty: boolean };

type DraftInfoToSave = Omit<DraftInfo, 'createdAt'>;

type DraftAction = typeof noop | ((draftInfoToSave: DraftInfoToSave) => Promise<void>);

interface UseDraftsReturn {
  saveComposeDraft: DraftAction;
  flushSaveComposeDraft: DraftAction;
  draftThreads: MailboxThreadInfo[];
  composeNewDraft: typeof noop | (() => string);
  deleteDraft: typeof noop | ((draftID: string) => Promise<void>);
  openDraft: typeof noop | ((threadID: string, emailID?: string) => void);
}

export const useDrafts = (): UseDraftsReturn => {
  const userData = useCurrentUserData();
  const drafts = useAppSelector((state) => state.draft.drafts);

  const dispatch = useDispatch();
  const [upsertDraft] = useCreateOrUpdateDraftMutation();
  const [deleteRemoteDraft] = useDeleteDraftMutation();

  const [saveComposeDraft, flushSaveComposeDraft] = useDebouncedAsyncCallback(
    async (draftInfoToSave: DraftInfoToSave) => {
      if (!userData) return;

      const { draftID, subject, text, toAddresses, ccAddresses, bccAddresses, fromAddress, existingThread } =
        draftInfoToSave;
      if (!validate(draftID)) {
        console.error(`Draft ID must be a valid UUID, but was ${draftID || ''}`);
        return;
      }

      // If we are trying to save a draft that is currently in the midst of being deleted, return.
      // Instead of using useAppSelector to access redux state, access the store directly
      // to get the most up to date value for currentDraftIDToDelete. Since this is a debounced function,
      // if we use useAppSelector, the value stored in redux could be stale by the time this
      // promise executes
      if (draftID === store.getState().draft.currentDraftIDToDelete) {
        console.warn('Attempting to save a draft that is currently being deleted. draftID:', draftID);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const currentDraftRaw = await IDB.get(getDraftIDBKey(userData.userID, draftID));
      const currentDraft = currentDraftRaw ? parseAndDecryptDraft(currentDraftRaw, userData) : undefined;

      const draftInfo: DraftInfo = {
        draftID,
        subject,
        text,
        toAddresses,
        ccAddresses,
        bccAddresses,
        fromAddress,
        createdAt: currentDraft?.createdAt ?? Date.now(),
        existingThread
      };
      const draftContent = getDraftSaveData(draftInfo, userData);
      const { errors } = await upsertDraft({
        variables: {
          request: {
            ...draftContent
          }
        }
      });
      // there was a draft in IDB, delete it
      if (currentDraftRaw && !errors) {
        await IDB.del(getDraftIDBKey(userData.userID, draftID));
      }
      dispatch(skemailDraftsReducer.actions.saveDraft({ draftInfo }));
    },
    SAVE_DRAFT_DEBOUNCE_MS
  );

  const draftThreads: Array<MailboxThreadInfo> = useMemo(
    () =>
      userData
        ? Array.from(drafts)
            .sort((a, b) => b.createdAt - a.createdAt)
            .map((draft) => {
              const {
                subject,
                text,
                toAddresses,
                ccAddresses,
                bccAddresses,
                fromAddress,
                draftID,
                createdAt,
                existingThread
              } = draft;
              const existingEmails: Array<MailboxEmailInfo> = existingThread ? existingThread.emails : [];
              const draftEmail: ThreadViewEmailInfo = {
                id: draftID,
                decryptedAttachmentMetadata: [],
                decryptedSubject: subject,
                decryptedText: text,
                from: {
                  address: fromAddress,
                  name: userData.publicData?.displayName
                },
                to: toAddresses,
                cc: ccAddresses,
                bcc: bccAddresses,
                createdAt: new Date(createdAt)
              };
              return {
                threadID: draftID,
                emailsUpdatedAt: new Date(createdAt),
                attributes: existingThread ? existingThread.attributes : { ...newDraftThreadAttributes },
                emails: [...existingEmails, draftEmail],
                // this thread is the original thread before adding the draft; the draft email is never part of
                // this thread, and this thread is never modified, before the draft is sent
                replyThread: existingThread
              };
            })
        : [],
    [drafts, userData]
  );

  // Do not return drafts if the user is not logged in
  if (!userData) {
    return {
      saveComposeDraft: noop,
      flushSaveComposeDraft: noop,
      draftThreads,
      composeNewDraft: noop,
      deleteDraft: noop,
      openDraft: noop
    };
  }

  const composeNewDraft = () => {
    const draftID = uuidv4();
    dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID }));
    return draftID;
  };

  const deleteDraft = async (draftID: string) => {
    try {
      dispatch(skemailDraftsReducer.actions.setCurrentDraftIDToDelete({ draftID }));
      // Cannot parallelize because they both modify IDB
      await IDB.del(getDraftIDBKey(userData.userID, draftID));
      await deleteRemoteDraft({
        variables: {
          request: {
            draftID
          }
        }
      });
      dispatch(skemailDraftsReducer.actions.deleteDraft({ draftID }));
    } catch (error) {
      console.error('Could not delete draft', error);
    }
  };

  const openDraft = (threadID: string, emailID?: string) => {
    const draftThread = draftThreads.find((thread) => thread.threadID === threadID);
    if (!draftThread) return;

    const draftThreadEmails = draftThread.emails;
    const email = emailID
      ? draftThreadEmails.find((currEmail) => currEmail.id === emailID)
      : draftThreadEmails[draftThreadEmails.length - 1]; // Defaults to the last email in the thread
    if (!email) return;

    dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID: threadID }));
    dispatch(skemailModalReducer.actions.editDraftCompose({ draftEmail: email, replyThread: draftThread.replyThread }));
  };

  return {
    saveComposeDraft,
    flushSaveComposeDraft,
    draftThreads,
    composeNewDraft,
    deleteDraft,
    openDraft
  };
};
