import React from 'react';
import { useDispatch } from 'react-redux';
import { ListChildComponentProps } from 'react-window';
import { SystemLabels } from 'skiff-graphql';
import { useGetThreadFromIdQuery } from 'skiff-mail-graphql';

import { NO_SUBJECT_TEXT } from '../../../constants/mailbox.constants';
import { useCurrentUserEmailAliases } from '../../../hooks/useCurrentUserEmailAliases';
import { MailboxThreadInfo } from '../../../models/thread';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { userLabelFromGraphQL, isUserLabel, getActiveSystemLabel } from '../../../utils/label';
import { convertHtmlToTextContent } from '../../MailEditor/mailEditorUtils';
import { ThreadNavigationIDs } from '../../Thread/Thread.types';
import { MessageCell } from '../MessageCell/MessageCell';

interface MailboxSearchResultItemData {
  searchResults: { emailID: string; thread: MailboxThreadInfo }[];
  setActiveResult: (activeThreadAndEmail: ThreadNavigationIDs | undefined) => void;
  activeEmailID: string | undefined;
  query: string;
}

function MailboxSearchResultItem({ index, style, data }: ListChildComponentProps<MailboxSearchResultItemData>) {
  // Redux actions
  const dispatch = useDispatch();

  const { searchResults, activeEmailID, setActiveResult, query } = data;
  const { emailID, thread: searchResultThread } = searchResults[index];

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
  const isDraft = systemLabels.includes(SystemLabels.Drafts);

  const email = emails.find((e) => e.id === emailID);
  const currentUserAliases = useCurrentUserEmailAliases();
  const isOutboundEmail = email && currentUserAliases.includes(email.from.address);

  const onSearchResultClick = () => {
    setActiveResult({ threadID, emailID });
    if (isDraft) return;
    // if compose is already open, collapse it so the thread panel is visible
    dispatch(skemailModalReducer.actions.collapse());
  };

  const threadUserlabels = userLabels.map(userLabelFromGraphQL).filter(isUserLabel);
  const currSystemLabel = getActiveSystemLabel(systemLabels);

  // If the email is outbound and there is a to-field present, display addresses from the TO field
  // Else, display the from address
  const addressObjs = isOutboundEmail && email && !!email.to.length ? email.to : [email?.from];
  const displayNames: string[] = addressObjs
    .map((addr) => addr?.name ?? addr?.address ?? '')
    .filter((addr) => !!addr?.length);
  const addresses: string[] = addressObjs.map((addr) => addr?.address ?? '').filter((addr) => !!addr?.length);

  const getMessage = () => {
    const decryptedText = email?.decryptedText;
    // Drafts are saved in local storage as HTML,
    // so we need to convert it to human readable text
    if (isDraft) {
      return decryptedText && convertHtmlToTextContent(decryptedText);
    }
    // Non draft emails when decrypted are formatted
    return decryptedText;
  };

  return (
    <div key={emailID} style={style}>
      <MessageCell
        active={emailID === activeEmailID}
        addresses={addresses}
        displayNames={displayNames}
        emailID={emailID}
        facepileNames={displayNames}
        hasAttachment={!!email?.decryptedAttachmentMetadata?.length}
        label={currSystemLabel ?? SystemLabels.Inbox}
        message={getMessage()}
        onClick={onSearchResultClick}
        query={query}
        renderDraftLabel={isDraft}
        subject={email?.decryptedSubject || NO_SUBJECT_TEXT}
        thread={thread}
        userLabels={threadUserlabels}
      />
    </div>
  );
}

export default React.memo(MailboxSearchResultItem);
