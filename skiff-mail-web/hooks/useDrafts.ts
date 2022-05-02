import * as IDB from 'idb-keyval';
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { v4 as uuidv4, validate } from 'uuid';

import { useRequiredCurrentUserData } from '../apollo/currentUser';
import { AddressObject, ThreadAttributes, ThreadFragment } from '../generated/graphql';
import { MailboxEmailInfo } from '../models/email';
import { MailboxThreadInfo } from '../models/thread';
import { skemailDraftsReducer } from '../redux/reducers/draftsReducer';
import { DraftInfo } from '../utils/crypto/draftDatagram';
import { getDraftIDBKey, saveDraftToIDB } from '../utils/draftUtils';
import { useAppSelector } from './redux/useAppSelector';
import useDebouncedAsyncCallback from './useDebouncedCallback';

const SAVE_DRAFT_DEBOUNCE_MS = 1000;

const newDraftThreadAttributes: ThreadAttributes = {
  read: true,
  systemLabels: [],
  userLabels: []
};

export const useDrafts = () => {
  const userData = useRequiredCurrentUserData();
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
      if (!currentDraftID || !validate(currentDraftID)) {
        console.error(`Draft ID must be a valid UUID, but was ${currentDraftID}`);
        return;
      }
      const currentDraft: DraftInfo | undefined = await IDB.get(getDraftIDBKey(userData.userID, currentDraftID));
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

  const draftThreads: Array<MailboxThreadInfo> = Array.from(drafts)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((draft) => {
      const { subject, text, toAddresses, ccAddresses, bccAddresses, draftID, createdAt, existingThread } = draft;
      const existingEmails: Array<MailboxEmailInfo> = existingThread ? existingThread.emails : [];
      const draftEmail: MailboxEmailInfo = {
        // Since this email doesn't actually exist in our database, create
        // an arbitrary ID. This only used as a React key for rendering
        // ThreadBlocks, so the only requirement is that it's a unique ID.
        id: uuidv4(),
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
    });

  const composeNewDraft = useCallback(() => {
    const draftID = uuidv4();
    dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID }));
  }, [dispatch]);

  const deleteDraft = async (draftID: string) => {
    dispatch(skemailDraftsReducer.actions.deleteDraft({ draftID }));
    await IDB.del(getDraftIDBKey(userData.userID, draftID));
  };

  return {
    saveCurrentDraft,
    flushSaveCurrentDraft,
    draftThreads,
    composeNewDraft,
    deleteDraft
  };
};
