import { useFlags } from 'launchdarkly-react-client-sdk';
import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useDispatch } from 'react-redux';
import { ListChildComponentProps } from 'react-window';
import { useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { doesNormalizedTextMatch, getMatchingTermsFromMatchInfo } from 'skiff-front-search';
import { ActionIcon, WalletAliasWithName, useCurrentUserEmailAliases } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { NoEmailBodyQueryMatchFlag } from 'skiff-utils';

import { COMPACT_MAILBOX_BREAKPOINT, NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useUserLabelsToRenderAsChips } from '../../../hooks/useUserLabelsToRenderAsChips';
import { ThreadDetailInfo } from '../../../models/thread';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { HiddenLabels, getActiveSystemLabel } from '../../../utils/label';
import { SkemailResultThreadInfo } from '../../../utils/search/searchTypes';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { ThreadNavigationIDs } from '../../Thread/Thread.types';
import { CompactMessageCell } from '../MessageCell/CompactMessageCell';
import { MessageCell } from '../MessageCell/MessageCell';

import { threadIsSelected, toggleThreadSelect } from './mailboxItemHelpers';

interface MailboxSearchResultItemData {
  searchResults: SkemailResultThreadInfo[];
  setActiveResult: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  activeEmailID: string | undefined;
  walletAliasesWithName: WalletAliasWithName[];
  listWidth: number;
  mailboxActions: Omit<ActionIcon, 'tooltip'>[];
}

function MailboxSearchResultItem({ index, style, data }: ListChildComponentProps<MailboxSearchResultItemData>) {
  // Redux actions
  const dispatch = useDispatch();

  const multiSelectOpen = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  // multi-select filter option; i.e. "Read", "All" etc
  const multiSelectFilter = useAppSelector((state) => state.mailbox.multiSelectFilter);
  const multiSelectOpenRef = useRef(multiSelectOpen);

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  const flags = useFlags();
  // whether to bypass logic that ensures part of email body matching query is excerpted; used for testing
  const skipEmailBodyQueryMatch = flags.noEmailBodyQueryMatch as NoEmailBodyQueryMatchFlag;

  useEffect(() => {
    // Update multiSelectOpen ref
    multiSelectOpenRef.current = multiSelectOpen;
  }, [multiSelectOpen]);

  const { searchResults, activeEmailID, setActiveResult, walletAliasesWithName, mailboxActions } = data;

  const fallbackResultValue: ThreadDetailInfo = {
    attributes: {
      read: false,
      systemLabels: [] as string[],
      userLabels: []
    },
    emails: [],
    emailsUpdatedAt: new Date(Date.now()),
    threadID: ''
  };

  const { emailID = '', thread: searchResultThread = fallbackResultValue, match } = searchResults[index] ?? {};

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

  const isMailItemCompact = data?.listWidth < COMPACT_MAILBOX_BREAKPOINT;

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
  const { emailAliases: currentUserAliases } = useCurrentUserEmailAliases();
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

  // Drafts are saved in local storage as HTML, so we need to convert it to human readable text
  // Non draft emails when decrypted are formatted
  const getFormattedDecryptedText = (text: string) => (isDraft ? convertHtmlToTextContent(text) : text);

  const getMessage = () => {
    const decryptedSnippet = email?.decryptedTextSnippet && getFormattedDecryptedText(email.decryptedTextSnippet);
    if (skipEmailBodyQueryMatch) return decryptedSnippet;
    // whether the email body as a whole contains a match for the query
    const hasContentMatch =
      match && Object.values(match).some((matchingFieldArr) => matchingFieldArr.includes('content'));

    if (hasContentMatch) {
      const matchingTerms = getMatchingTermsFromMatchInfo(match);

      // whether the match is present in the default snippet
      const doesSnippetContainMatch = !!decryptedSnippet && doesNormalizedTextMatch(decryptedSnippet, matchingTerms);

      // if match is not present in snippet, use the entire email body,
      // so that we can excerpt the appropriate part to highlight the match
      if (!doesSnippetContainMatch && email?.decryptedText) {
        return getFormattedDecryptedText(email.decryptedText);
      }
    }

    return decryptedSnippet;
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
      toggleThreadSelect(dispatch, thread.threadID, isSelected, multiSelectFilter);
    }
    dispatch(skemailMailboxReducer.actions.setLastSelctedIndex(index));
  };

  return (
    <div key={emailID} style={style}>
      {!isMailItemCompact && (
        <MessageCell
          active={emailID === activeEmailID}
          addresses={addresses}
          displayNames={displayNames}
          dragRef={drag}
          emailID={emailID}
          facepileNames={displayNames}
          hasAttachment={!!email?.decryptedAttachmentMetadata?.length}
          label={currSystemLabel ?? SystemLabels.Inbox}
          mailboxActions={mailboxActions}
          matchInfo={match}
          message={getMessage()}
          multiSelectOpen={multiSelectOpen}
          onClick={onSearchResultClick}
          onSelectToggle={onSelectToggle}
          renderDraftLabel={isDraft}
          selected={isSelected}
          subject={email?.decryptedSubject || NO_SUBJECT_TEXT}
          thread={thread}
          userLabels={labelsToRender}
          walletAliasesWithName={walletAliasesWithName}
        />
      )}
      {isMailItemCompact && (
        <CompactMessageCell
          active={emailID === activeEmailID}
          addresses={addresses}
          date={thread.emailsUpdatedAt}
          displayNames={displayNames}
          dragRef={drag}
          hasAttachment={!!email?.decryptedAttachmentMetadata?.length}
          key={thread.threadID}
          label={currSystemLabel ?? SystemLabels.Inbox}
          matchInfo={match}
          message={getMessage()}
          numEmails={thread.emails.length}
          onClick={onSearchResultClick}
          onSelectToggle={onSelectToggle}
          read={thread.attributes.read}
          selected={isSelected}
          subject={thread.emails[0]?.decryptedSubject || NO_SUBJECT_TEXT}
          thread={thread}
          userLabels={labelsToRender}
          walletAliasesWithName={walletAliasesWithName}
        />
      )}
    </div>
  );
}

export default React.memo(MailboxSearchResultItem);
