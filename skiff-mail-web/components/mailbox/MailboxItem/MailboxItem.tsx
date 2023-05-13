import uniqBy from 'lodash/uniqBy';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { ListChildComponentProps } from 'react-window';
import { useCurrentUserEmailAliases } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';

import { NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useMarkAsReadUnread } from '../../../hooks/useMarkAsReadUnread';
import { useUserLabelsToRenderAsChips } from '../../../hooks/useUserLabelsToRenderAsChips';
import { MailboxEmailInfo } from '../../../models/email';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailDraftsReducer } from '../../../redux/reducers/draftsReducer';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { threadsEqual, userLabelsEqual } from '../../../utils/mailboxUtils';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { animateMailListHeader } from '../MailboxHeader';
import { MobileMessageCell } from '../MessageCell/MobileMessageCell';
import { ThreadMessageCell } from '../MessageCell/ThreadMessageCell';

import { threadIsSelected, toggleThreadSelect } from './mailboxItemHelpers';

interface MailboxItemData {
  threads: MailboxThreadInfo[];
  selectedThreadIDs: string[];
  mobileMultiItemsActive: boolean;
  activeThreadID?: string;
  setActiveThreadID: (thread?: { threadID: string; emailID?: string | undefined } | undefined) => void;
}

function MailboxItem({ index, style, data }: ListChildComponentProps<MailboxItemData>) {
  const dispatch = useDispatch();
  const { value: label } = useRouterLabelContext();
  const { markThreadsAsReadUnread } = useMarkAsReadUnread();
  const currentUserEmailAliases = useCurrentUserEmailAliases();

  const isDrafts = label === SystemLabels.Drafts;
  const isSent = label === SystemLabels.Sent;
  const isScheduledSend = label === SystemLabels.ScheduleSend;
  const isOutboundFolder = isDrafts || isSent || isScheduledSend;

  const openDraft = (draft: MailboxEmailInfo) => dispatch(skemailModalReducer.actions.editDraftCompose(draft));

  const {
    threads,
    selectedThreadIDs: currSelectedThreadIDs,
    mobileMultiItemsActive,
    activeThreadID,
    setActiveThreadID
  } = data;

  const thread = index === 0 ? undefined : threads[index];
  const allUserLabels = useUserLabelsToRenderAsChips(thread?.attributes.userLabels || []);

  if (index === 0) {
    return <div style={style} />;
  }
  if (!thread?.emails?.length) return null;

  const isSelected = threadIsSelected(currSelectedThreadIDs, thread.threadID);
  const firstEmail = thread.emails[0];
  const latestEmail = thread.emails[thread.emails.length - 1];

  const emailsSortedByCreatedDesc = [...thread.emails];
  emailsSortedByCreatedDesc.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  // Latest from address that isn't the sender and that is different from the first email sender of the thread
  const latestUniqueFrom = emailsSortedByCreatedDesc.find(
    (email) => email.from.address !== firstEmail?.from.address
  )?.from;
  // Latest email in thread that was sent by current user, used for display names and avatars for outbound mail items
  const outboundDisplayTos =
    (emailsSortedByCreatedDesc.find((email) => currentUserEmailAliases.includes(email.from.address))?.to ||
      latestEmail?.to) ??
    [];
  const inboundDisplayFroms = [firstEmail?.from, latestUniqueFrom].filter(filterExists);

  // If the email is outbound, display up to two addresses from the TO field of the last email in the thread sent by current user
  // Else, display the latest and first FROM addresses in the thread
  const addressObjs = isOutboundFolder && !!outboundDisplayTos.length ? outboundDisplayTos : inboundDisplayFroms;

  const displayNames: string[] = addressObjs.map((addr) => addr.name || addr.address);

  /** Util function to get recipients for sent-folder facepile or senders for inbox facepile */
  const getFacepileData = () => {
    if (isOutboundFolder) {
      const recipientAddresses: string[] = addressObjs.map((addr) => addr.address);
      // Pre-truncated displayNames coincide with facepileNames for outbound mail
      return { facepileNames: displayNames, facepileAddresses: recipientAddresses };
    } else {
      // Get all unique from objects for possible use in facepile, start the array with the original sender and latest unique sender
      // to ensure they're prioritized for inclusion in the visible avatars
      const allUniqueFroms = uniqBy(
        inboundDisplayFroms.concat(emailsSortedByCreatedDesc.map((email) => email.from)),
        'address'
      );
      const senderNames: string[] = allUniqueFroms.map((addr) => addr.name || addr.address);
      const senderAddresses: string[] = allUniqueFroms.map((addr) => addr.address);
      return { facepileNames: senderNames, facepileAddresses: senderAddresses };
    }
  };

  const { facepileNames, facepileAddresses } = getFacepileData();

  const onSelectToggle = (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => {
    // If shift key is selected and another thread was recently selected, handle multi-select
    if (e.shiftKey) {
      dispatch(skemailMailboxReducer.actions.selectDeselectThreadsBetween({ threads, index }));
    }
    // Else if not shift key and the thread is selected, deselect it by filtering it out
    else {
      toggleThreadSelect(dispatch, thread.threadID, isSelected);
    }
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(index));
  };

  const getMessage = () => {
    const decryptedText = latestEmail?.decryptedTextSnippet;
    // Drafts are saved in local storage as HTML,
    // so we need to convert it to human readable text
    if (label === SystemLabels.Drafts) {
      return decryptedText && convertHtmlToTextContent(decryptedText);
    }
    // Non draft emails when decrypted are formatted
    return decryptedText;
  };

  const onMessageCellClick = (e: React.MouseEvent<Element | HTMLInputElement, MouseEvent>) => {
    if (!latestEmail) return;
    if (isMobile) {
      // Reset In case header is hidden
      animateMailListHeader('1');
    }
    if (isMobile && mobileMultiItemsActive) {
      onSelectToggle(e);
      return;
    }
    if (isDrafts) {
      dispatch(skemailDraftsReducer.actions.setCurrentDraftID({ draftID: thread.threadID }));
      openDraft(latestEmail);
    } else {
      // if compose is already open, collapse it so the thread panel is visible
      dispatch(skemailModalReducer.actions.collapse());
    }
    setActiveThreadID({ threadID: thread.threadID });
  };

  const message = getMessage();

  // Do not render the user label if we are in the user label mailbox as it is redundant
  const labelsToRender = allUserLabels?.filter((userLabel) => userLabel.value !== label);

  return (
    <div key={thread.threadID} style={{ ...style }}>
      {!isMobile && (
        <ThreadMessageCell
          active={thread.threadID === activeThreadID}
          addresses={facepileAddresses}
          displayNames={displayNames}
          facepileNames={facepileNames}
          hasAttachment={!!latestEmail?.decryptedAttachmentMetadata?.length}
          key={thread.threadID}
          label={label}
          message={message}
          onClick={onMessageCellClick}
          onSelectToggle={onSelectToggle}
          selected={isSelected}
          subject={thread.emails[0]?.decryptedSubject || NO_SUBJECT_TEXT}
          thread={thread}
          userLabels={labelsToRender}
        />
      )}
      {isMobile && (
        <>
          <MobileMessageCell
            active={thread.threadID === activeThreadID}
            addresses={facepileAddresses}
            date={thread.emailsUpdatedAt}
            displayNames={displayNames}
            facepileNames={facepileNames}
            hasAttachment={!!latestEmail?.decryptedAttachmentMetadata?.length}
            key={thread.threadID}
            label={label}
            markThreadsAsReadUnread={() => markThreadsAsReadUnread([thread], !thread.attributes.read)}
            message={message}
            numEmails={thread.emails.length}
            onClick={onMessageCellClick}
            onSelectToggle={onSelectToggle}
            read={thread.attributes.read}
            selected={isSelected}
            subject={thread.emails[0]?.decryptedSubject || NO_SUBJECT_TEXT}
            threadID={thread.threadID}
            userLabels={labelsToRender}
          />
        </>
      )}
    </div>
  );
}

const threadActive = (
  prev: Readonly<ListChildComponentProps<MailboxItemData>>,
  next: Readonly<ListChildComponentProps<MailboxItemData>>
) => {
  // re-render if thread was active or if thread will be active or if thread array was changed
  const threadID = prev.data.threads[prev.index]?.threadID ?? '';

  const wasActive = prev.data.activeThreadID === threadID;
  const willBeActive = next.data.activeThreadID === threadID;
  const threadChanged = !threadsEqual(prev.data.threads, next.data.threads); // Thread added/removed
  const selectedStateChanged =
    prev.data.selectedThreadIDs.includes(threadID) !== next.data.selectedThreadIDs.includes(threadID); // Thread selected/deselected
  const userLabelsChanged = !userLabelsEqual(
    prev.data.threads[prev.index]?.attributes?.userLabels.map((l) => l.labelID) ?? [],
    next.data.threads[next.index]?.attributes?.userLabels.map((l) => l.labelID) ?? []
  );
  const readStatusChanged =
    prev.data.threads[prev.index]?.attributes?.read !== next.data.threads[next.index]?.attributes?.read;
  const multSelectChanged = prev.data.mobileMultiItemsActive !== next.data.mobileMultiItemsActive;
  const styleChanged = prev.style !== next.style;
  const indexChanged = prev.index !== next.index;

  const shouldRender =
    wasActive ||
    willBeActive ||
    threadChanged ||
    selectedStateChanged ||
    userLabelsChanged ||
    readStatusChanged ||
    multSelectChanged ||
    styleChanged ||
    indexChanged;
  return !shouldRender;
};

export default React.memo(MailboxItem, threadActive);
