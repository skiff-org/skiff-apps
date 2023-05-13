import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDispatch } from 'react-redux';
import { ListChildComponentProps } from 'react-window';
import { useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { useCurrentUserEmailAliases } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useUserLabelsToRenderAsChips } from '../../../hooks/useUserLabelsToRenderAsChips';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { getActiveSystemLabel, HiddenLabels } from '../../../utils/label';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { ThreadNavigationIDs } from '../../Thread/Thread.types';
import { MessageCell } from '../MessageCell/MessageCell';

import { threadIsSelected, toggleThreadSelect } from './mailboxItemHelpers';

interface MailboxSearchResultItemData {
  searchResults: { emailID: string; thread: MailboxThreadInfo }[];
  setActiveResult: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  activeEmailID: string | undefined;
  query: string;
}

function MailboxSearchResultItem({ index, style, data }: ListChildComponentProps<MailboxSearchResultItemData>) {
  // Redux actions
  const dispatch = useDispatch();

  const multiSelectOpen = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const multiSelectOpenRef = useRef(multiSelectOpen);

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  useEffect(() => {
    // Update multiSelectOpen ref
    multiSelectOpenRef.current = multiSelectOpen;
  }, [multiSelectOpen]);

  const { searchResults, activeEmailID, setActiveResult, query } = data;

  const fallbackResultValue: MailboxThreadInfo = {
    attributes: {
      read: false,
      systemLabels: [] as string[],
      userLabels: []
    },
    emails: [],
    emailsUpdatedAt: new Date(Date.now()),
    threadID: ''
  };

  const { emailID = '', thread: searchResultThread = fallbackResultValue } = searchResults[index] ?? {};

  // Read fetch thread (from the cache, since it has already been fetched in the list
  //  view MailboxSearchResults) to get the most up to date version of the thread
  // The thread attributes could have been modified -- ie the thread could have been marked as read/unread
  const thread =
    useGetThreadFromIdQuery({ variables: { threadID: searchResultThread.threadID } }).data?.userThread ||
    searchResultThread;

  const {
    threadID,
    emails,
    attributes: { systemLabels, userLabels }
  } = thread;

  const labelsToRender = useUserLabelsToRenderAsChips(userLabels);

  const isDraft = systemLabels.includes(SystemLabels.Drafts);
  const isSelected = threadIsSelected(selectedThreadIDs, threadID);
  const context = useRouterLabelContext();
  const currRouteLabel = context?.value || HiddenLabels.Search;

  const [_, drag, preview] = useDrag({
    // Also keep track of the current route label to use the most up to date route label when dragging
    item: { threadIDs: selectedThreadIDs.length ? selectedThreadIDs : [threadID], currRouteLabel },
    type: DNDItemTypes.MESSAGE_CELL
  });

  const email = emails.find((e) => e.id === emailID);
  const currentUserAliases = useCurrentUserEmailAliases();
  const isOutboundEmail = email && currentUserAliases.includes(email.from.address);

  const onSearchResultClick = () => {
    setActiveResult({ threadID, emailID });
    if (isDraft) return;
    // if compose is already open, collapse it so the thread panel is visible
    dispatch(skemailModalReducer.actions.collapse());
  };

  const currSystemLabel = getActiveSystemLabel(systemLabels);

  // If the email is outbound and there is a to-field present, display addresses from the TO field
  // Else, display the from address
  const addressObjs = isOutboundEmail && email && !!email.to.length ? email.to : [email?.from];
  const displayNames: string[] = addressObjs
    .map((addr) => addr?.name ?? addr?.address ?? '')
    .filter((addr) => !!addr?.length);
  const addresses: string[] = addressObjs.map((addr) => addr?.address ?? '').filter((addr) => !!addr?.length);

  const getMessage = () => {
    const decryptedText = email?.decryptedTextSnippet;
    // Drafts are saved in local storage as HTML,
    // so we need to convert it to human readable text
    if (isDraft) {
      return decryptedText && convertHtmlToTextContent(decryptedText);
    }
    // Non draft emails when decrypted are formatted
    return decryptedText;
  };

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const onSelectToggle = (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => {
    const threads = searchResults.map((t) => t.thread);
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

  return (
    <div key={emailID} style={style}>
      <MessageCell
        active={emailID === activeEmailID}
        addresses={addresses}
        displayNames={displayNames}
        dragRef={drag}
        emailID={emailID}
        facepileNames={displayNames}
        hasAttachment={!!email?.decryptedAttachmentMetadata?.length}
        label={currSystemLabel ?? SystemLabels.Inbox}
        message={getMessage()}
        multiSelectOpen={multiSelectOpen}
        onClick={onSearchResultClick}
        onSelectToggle={onSelectToggle}
        query={query}
        renderDraftLabel={isDraft}
        selected={isSelected}
        subject={email?.decryptedSubject || NO_SUBJECT_TEXT}
        thread={thread}
        userLabels={labelsToRender}
      />
    </div>
  );
}

export default React.memo(MailboxSearchResultItem);
