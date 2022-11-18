import { Button, Icon, IconButton } from 'nightwatch-ui';
import React, { Suspense } from 'react';
import { useMemo, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import { useDrafts } from '../../hooks/useDrafts';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { Attachments, useAttachments } from '../Attachments';

import { ThreadBlockDropdown } from './ThreadBlockDropdown';
import { ThreadBlockHeader } from './ThreadBlockHeader';

const MailHTMLView = React.lazy(() => import('./MailHTMLView/MailHTMLView'));

const ThreadBlockContainer = styled.div<{ expanded: boolean; isDarkMode?: boolean }>`
  width: 100%;
  box-shadow: ${(props) => (!props.isDarkMode ? 'var(--shadow-l1)' : '')};
  border: 1px solid ${(props) => (!props.isDarkMode ? 'transparent' : 'var(--border-secondary)')};
  background: var(--bg-l3-solid);
  transition: all 0.15s ease-in;
  &:hover {
    box-shadow: ${(props) => (!props.expanded ? 'var(--shadow-l2)' : 'var(--shadow-l1)')};
  }
  border-radius: 12px;
  box-sizing: border-box;
  padding: 0px 16px;
  ${isMobile && 'padding: unset;'}
`;

const ThreadBlockExpanded = styled.div`
  display: flex;
  flex-direction: column;
`;

const EmailBody = styled.div<{ isTransactional: boolean }>`
  padding: ${(props) => (props.isTransactional ? '24px 0px' : '24px 50px')};
  color: var(--text-primary);
  ${isMobile
    ? `
        padding: 0;
        overflow: hidden;
      `
    : ''}
`;

const ActionsContainer = styled.div`
  margin: 24px 50px 24px 0px;
  display: flex;
  gap: 8px;
  flex-flow: wrap;
  align-items: center;
`;

const MobileReplyContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin: 32px 16px;
  box-sizing: border-box;
`;

type ThreadBlockProps = {
  // Thread fragment from GraphQL
  thread: MailboxThreadInfo;
  // Email fragment from GraphQL
  email: MailboxEmailInfo;
  // Whether the body of the email is fully displayed
  expanded: boolean;
  // Whether to disable expanding / collapsing on click (for the most recent email)
  disableOnClick: boolean;
  // Handler when user clicks on the block
  onClick: (id: string, evt?: React.MouseEvent) => void;
  onClose: () => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  // Aliases
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
};

export const ThreadBlockDataTest = {
  threadBlock: 'thread-block',
  threadBlockExpanded: 'thread-block-expanded',
  emailBody: 'email-body'
};

/**
 * Component to render a single email in a thread.
 */
function ThreadBlock(props: ThreadBlockProps) {
  const { disableOnClick, expanded, email, thread, onClick, onClose, currentLabel, defaultEmailAlias, emailAliases } =
    props;
  const { decryptedSubject, decryptedAttachmentMetadata } = email;

  const { theme } = useTheme();
  const userSignature = useUserSignature();

  // We detect transactional files by checking if their content contains a table closing tag - this works surprisingly well
  const isTransactional = useMemo(() => email.decryptedHtml?.includes('</table>'), [email]);

  const { downloadAllAttachments, downloadAttachment, isDownloadingAttachments, attachments } = useAttachments({
    metadata: decryptedAttachmentMetadata
  });
  const { composeNewDraft } = useDrafts();

  // Redux actions
  const dispatch = useDispatch();

  const reply = React.useCallback(() => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyCompose({
        email,
        thread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  }, [composeNewDraft, defaultEmailAlias, dispatch, email, emailAliases, thread, userSignature]);

  const replyAll = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyAllCompose({
        email,
        thread,
        emailAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const forward = () => {
    composeNewDraft();
    dispatch(skemailModalReducer.actions.forwardCompose({ email, emailAliases, defaultEmailAlias }));
  };

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ThreadBlockContainer
        data-test={ThreadBlockDataTest.threadBlock}
        expanded={expanded}
        isDarkMode={theme === 'dark'}
      >
        <ThreadBlockHeader
          disableOnClick={disableOnClick}
          email={email}
          expanded={expanded}
          moreButtonRef={moreButtonRef}
          onClick={onClick}
          setShowMoreOptions={setShowMoreOptions}
        />
        {expanded && (
          <ThreadBlockExpanded data-test={ThreadBlockDataTest.threadBlockExpanded}>
            <EmailBody data-test={ThreadBlockDataTest.emailBody} isTransactional={!!isTransactional} ref={emailBodyRef}>
              <Suspense fallback={null}>
                <MailHTMLView attachments={attachments} email={email} />
              </Suspense>
            </EmailBody>
            <Attachments
              attachments={attachments}
              isDownloadingAttachments={isDownloadingAttachments}
              onDownload={(id) => {
                if (!decryptedAttachmentMetadata) return;

                const meta = decryptedAttachmentMetadata.find(({ attachmentID }) => attachmentID === id);
                if (!meta || !meta.decryptedMetadata) return;

                void downloadAttachment(id, meta.decryptedMetadata?.contentType, meta.decryptedMetadata?.filename);
              }}
              onDownloadAll={() => {
                void downloadAllAttachments(decryptedAttachmentMetadata, `${decryptedSubject}-attachments.zip`);
              }}
            />
            {/* Forward, Reply Reply All on Browser */}
            {!isMobile && (
              <ActionsContainer>
                <Button onClick={reply} startIcon={Icon.Reply} type='secondary'>
                  Reply
                </Button>
                <Button onClick={replyAll} startIcon={Icon.ReplyAll} type='secondary'>
                  Reply all
                </Button>
                <Button onClick={forward} startIcon={Icon.ForwardEmail} type='secondary'>
                  Forward
                </Button>
              </ActionsContainer>
            )}
            <MobileView>
              <MobileReplyContainer>
                <Button align='center' dataTest='mobile-reply' fullWidth onClick={reply} startIcon={Icon.Reply}>
                  Reply
                </Button>
                <IconButton
                  color='secondary'
                  dataTest='mobile-reply-all'
                  icon={Icon.ReplyAll}
                  onClick={replyAll}
                  type='filled'
                />
                <IconButton
                  color='secondary'
                  dataTest='mobile-forward'
                  icon={Icon.ForwardEmail}
                  onClick={forward}
                  type='filled'
                />
              </MobileReplyContainer>
            </MobileView>
          </ThreadBlockExpanded>
        )}
      </ThreadBlockContainer>
      <ThreadBlockDropdown
        buttonRef={moreButtonRef}
        currentLabel={currentLabel}
        defaultEmailAlias={defaultEmailAlias}
        email={email}
        emailAliases={emailAliases}
        onClose={onClose}
        open={showMoreOptions}
        setOpen={setShowMoreOptions}
        thread={thread}
      />
    </>
  );
}

export default React.memo(ThreadBlock);
