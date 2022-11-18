import * as IDB from 'idb-keyval';
import { noop } from 'lodash';
import { useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useDebouncedAsyncCallback } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { AddressObject, ThreadAttributes } from 'skiff-graphql';
import { ThreadFragment } from 'skiff-mail-graphql';
import { DraftInfo } from 'skiff-mail-graphql';
import { v4 as uuidv4, validate } from 'uuid';

import { useCurrentUserData } from '../apollo/currentUser';
import { MailboxEmailInfo } from '../models/email';
import { MailboxThreadInfo } from '../models/thread';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { getDraftIDBKey, parseAndDecryptDraft, saveDraftToIDB } from '../utils/draftUtils';

import { useAppSelector } from './redux/useAppSelector';
import { getSearchWorker } from './useSearchWorker';

const SAVE_DRAFT_DEBOUNCE_MS = 1000;

const newDraftThreadAttributes: ThreadAttributes = {
  read: true,
  systemLabels: [SystemLabels.Drafts],
  userLabels: []
};

export type MailDraftAttributes = Omit<DraftInfo, 'draftID' | 'createdAt'> & { composeIsDirty: boolean };

export const useDrafts = () => {
  const userData = useCurrentUserData();
  const currentDraftID = useAppSelector((state) => state.draft.currentDraftID);
  const drafts = useAppSelector((state) => state.draft.drafts);
  const dispatch = useDispatch();
  const [saveCurrentDraft, flushSaveCurrentDraft] = useDebouncedAsyncCallback(
    async (
      subject: string,
      text: string,
      toAddresses: Array<AddressObject>,
      ccAddresses: Array<AddressObject>,
      bccAddresses: Array<AddressObject>,
      existingThread?: ThreadFragment
    ) => {
      if (!userData) return;
      if (!currentDraftID || !validate(currentDraftID)) {
        console.error(`Draft ID must be a valid UUID, but was ${currentDraftID}`);
        return;
      }
      const currentDraftRaw = await IDB.get(getDraftIDBKey(userData.userID, currentDraftID));
      const currentDraft = currentDraftRaw ? parseAndDecryptDraft(currentDraftRaw, userData) : undefined;
      const draftInfo: DraftInfo = {
        draftID: currentDraftID,
        subject,
        text,
        toAddresses,
        ccAddresses,
        bccAddresses,
        createdAt: currentDraft?.createdAt ?? Date.now(),
        existingThread
      };
      await saveDraftToIDB(draftInfo, userData);
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
              const { subject, text, toAddresses, ccAddresses, bccAddresses, draftID, createdAt, existingThread } =
                draft;
              const existingEmails: Array<MailboxEmailInfo> = existingThread ? existingThread.emails : [];
              const draftEmail: MailboxEmailInfo = {
                id: draftID,
                decryptedAttachmentMetadata: [],
                decryptedSubject: subject,
                decryptedText: text,
                from: {
                  address: userData.username,
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
                emails: [...existingEmails, draftEmail]
              };
            })
        : [],
    [drafts, userData]
  );

  // Do not return drafts if the user is not logged in
  if (!userData) {
    return {
      saveCurrentDraft: noop,
      flushSaveCurrentDraft: noop,
      draftThreads,
      composeNewDraft: noop,
      deleteDraft: noop
    };
  }

  const composeNewDraft = () => {
    const draftID = uuidv4();
    dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID }));
  };

  const deleteDraft = async (draftID: string) => {
    // Cannot parallelize because they both modify IDB
    await IDB.del(getDraftIDBKey(userData.userID, draftID));
    await getSearchWorker()?.remove(draftID);
    dispatch(skemailDraftsReducer.actions.deleteDraft({ draftID }));
  };

  return {
    saveCurrentDraft,
    flushSaveCurrentDraft,
    draftThreads,
    composeNewDraft,
    deleteDraft
  };
};
