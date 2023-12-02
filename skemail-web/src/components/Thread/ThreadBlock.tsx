import {
  Button,
  FilledVariant,
  Icon,
  IconText,
  Icons,
  ThemeMode,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  UnsubscribeInfo,
  abbreviateWalletAddress,
  isWalletLookupSupported,
  proxyAttributes,
  rewriteCSSAttribute,
  splitEmailToAliasAndDomain,
  useTheme,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes, isENSName } from 'skiff-utils';
import styled from 'styled-components';

import { useDrafts } from '../../hooks/useDrafts';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { openWalletLookupLink } from '../../utils/walletUtils/walletUtils';
import { Attachments, useAttachments } from '../Attachments';
import { getEmailBody } from '../MailEditor/mailEditorUtils';

import { ThreadBlockDropdown } from './ThreadBlockDropdown';
import { ThreadBlockHeader } from './ThreadBlockHeader';

const MailHTMLView = React.lazy(() => import('./MailHTMLView/MailHTMLView'));
const ThreadBlockContainer = styled.div<{ $expanded: boolean; $isTrashed: boolean; $isDarkMode?: boolean }>`
  width: 100%;

  ${({ $isTrashed }) =>
    isMobile
      ? `border-bottom: 1px solid ${$isTrashed ? 'var(--border-destructive)' : 'var(--border-tertiary)'};`
      : `border: 1px solid ${$isTrashed ? 'var(--border-destructive)' : 'var(--border-secondary)'};`}

  background: var(--bg-l2-solid);
  &:hover {
    box-shadow: ${(props) => (!props.$expanded ? 'var(--shadow-l1)' : '')};
  }
  border-radius: ${isMobile ? 0 : 12}px;
  box-sizing: border-box;
  padding: ${isMobile ? `0px` : '16px'};
`;

const ThreadBlockExpanded = styled.div`
  display: flex;
  flex-direction: column;
  ${isMobile
    ? `
        padding-bottom: 24px;
      `
    : ''}
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
  display: flex;
  gap: 8px;
  flex-flow: wrap;
  align-items: center;
`;

const ActionsBlockContainer = styled.div`
  margin: 24px 50px 24px 0px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MobileWalletInfoContainer = styled.div`
  margin: 8px 16px;
`;

const InsetBanner = styled.div`
  display: flex;
  align-items: center;
  width: calc(100% + 32px);
  background: var(--bg-overlay-tertiary);
  border: 1px solid var(--border-tertiary);
  border-left-width: 0px;
  border-right-width: 0px;
  height: 44px;
  padding: 8px 24px;
  box-sizing: border-box;
  margin-left: -16px;
  margin-top: 8px;
  justify-content: space-between;
`;

const ETHBlock = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 8px 12px;
  width: fit-content;
  gap: 16px;

  background: var(--bg-overlay-tertiary);
  border-radius: 8px;
`;

const NameBlock = styled.div`
  display: flex;
  flex-direction: column;
`;

type ThreadBlockProps = {
  // Thread fragment from GraphQL
  thread: ThreadDetailInfo;
  // Email fragment from GraphQL
  email: ThreadViewEmailInfo;
  // Whether the body of the email is fully displayed
  expanded: boolean;
  // Whether to disable expanding / collapsing on click (for the most recent email)
  disableOnClick: boolean;
  // Handler when user clicks on the block
  onClick: (id: string, evt?: React.MouseEvent) => void;
  // Label of the mailbox where the thread is rendered in
  currentLabel: string;
  // Aliases
  defaultEmailAlias: string | undefined;
  emailAliases: string[];
  quickAliases: string[];
  isTrashed: boolean;
  // If applicable to the thread, the unsubscribe data including the mailto or redirect links
  unsubscribeInfo: UnsubscribeInfo | undefined;
  renderThreadActions?: boolean;
};

export const ThreadBlockDataTest = {
  threadBlock: 'thread-block',
  walletBlock: 'thread-block',
  threadBlockExpanded: 'thread-block-expanded',
  emailBody: 'email-body',
  externalLinkBtn: 'external-link-btn'
};

// check if email contains remote content by rewriting proxied URLs and seeing if it changes the email content
const doesEmailContainRemoteContent = (email: MailboxEmailInfo, originUrl: URL) => {
  const bodyContent = getEmailBody(email);
  const dom1 = new DOMParser().parseFromString(bodyContent, 'text/html');
  const { numProxy } = proxyAttributes(dom1, true);
  rewriteCSSAttribute(dom1, originUrl, true);
  const dom2 = new DOMParser().parseFromString(bodyContent, 'text/html');
  proxyAttributes(dom2, false);
  rewriteCSSAttribute(dom2, originUrl, false);
  // if different, remote content is contained
  return { containsRemoteContent: !dom1.isEqualNode(dom2), numProxy };
};

/**
 * Component to render a single email in a thread.
 */
function ThreadBlock(props: ThreadBlockProps) {
  const {
    disableOnClick,
    expanded,
    email,
    thread,
    onClick,
    currentLabel,
    defaultEmailAlias,
    emailAliases,
    quickAliases,
    isTrashed,
    unsubscribeInfo,
    renderThreadActions = true
  } = props;
  const { decryptedSubject, decryptedAttachmentMetadata } = email;
  const { address: fromAddress } = email.from;

  const { alias: fromAlias } = splitEmailToAliasAndDomain(fromAddress);

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
        quickAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  }, [composeNewDraft, defaultEmailAlias, dispatch, email, emailAliases, quickAliases, thread, userSignature]);

  const replyAll = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.replyAllCompose({
        email,
        thread,
        emailAliases,
        quickAliases,
        defaultEmailAlias,
        signature: userSignature
      })
    );
  };

  const forward = () => {
    composeNewDraft();
    dispatch(
      skemailModalReducer.actions.forwardCompose({ email, emailAliases, quickAliases, defaultEmailAlias, thread })
    );
  };

  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);

  const emailContainsRemoteContent = useMemo(() => {
    return doesEmailContainRemoteContent(email, new URL(window.location.origin));
  }, [email]);

  // Preferred user setting for blocking remote content
  const [userBlockRemoteContent] = useUserPreference(StorageTypes.BLOCK_REMOTE_CONTENT);

  // Gets the default value for blocking/unblocking remote content for the curr thread
  const getShouldBlockRemoteContentDefault = useCallback(() => {
    // If no remote content exists, do not disable it
    if (!emailContainsRemoteContent.containsRemoteContent) return false;
    // Otherwise, return the user-preferred default value
    return userBlockRemoteContent;
  }, [emailContainsRemoteContent.containsRemoteContent, userBlockRemoteContent]);

  // State for blocking/unblocking remote content for the curr thread
  const [shouldBlockRemoteContent, setShouldBlockRemoteContent] = useState(getShouldBlockRemoteContentDefault());

  // Reset state for blocking/unblocking remote content back to default when the curr thread changes
  useEffect(() => {
    setShouldBlockRemoteContent(getShouldBlockRemoteContentDefault());
  }, [thread.threadID, getShouldBlockRemoteContentDefault]);

  const numBlocked = emailContainsRemoteContent.numProxy;

  const openWalletLookupPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    openWalletLookupLink(fromAlias); // fromAlias
  };
  const walletInfo = (
    <>
      {isWalletLookupSupported(fromAlias) && (
        <ETHBlock data-test={ThreadBlockDataTest.walletBlock}>
          <NameBlock>
            <Typography color='secondary' mono>
              {isENSName(fromAlias) ? fromAlias : abbreviateWalletAddress(fromAlias, 12, 12)}
            </Typography>
            <Typography color='disabled' mono size={TypographySize.CAPTION}>
              SENDER ADDRESS
            </Typography>
          </NameBlock>
          <Icons
            color='disabled'
            dataTest={ThreadBlockDataTest.externalLinkBtn}
            icon={Icon.ExternalLink}
            onClick={openWalletLookupPage}
          />
        </ETHBlock>
      )}
    </>
  );
  return (
    <>
      <ThreadBlockContainer
        $expanded={expanded}
        $isDarkMode={theme === ThemeMode.DARK}
        $isTrashed={isTrashed}
        data-test={ThreadBlockDataTest.threadBlock}
      >
        <ThreadBlockHeader
          disableOnClick={disableOnClick}
          email={email}
          expanded={expanded}
          moreButtonRef={moreButtonRef}
          onClick={onClick}
          renderThreadActions={renderThreadActions}
          reply={() => reply()}
          setShowMoreOptions={setShowMoreOptions}
        />
        {expanded && (
          <ThreadBlockExpanded data-test={ThreadBlockDataTest.threadBlockExpanded}>
            {userBlockRemoteContent && numBlocked > 0 && (
              <InsetBanner>
                <Typography color='secondary'>{`${pluralize('images', numBlocked, true)} ${
                  shouldBlockRemoteContent ? 'blocked' : 'loaded'
                } `}</Typography>
                <IconText
                  label={shouldBlockRemoteContent ? 'Load' : 'Block'}
                  onClick={() => setShouldBlockRemoteContent((prev) => !prev)}
                  variant={FilledVariant.FILLED}
                />
              </InsetBanner>
            )}
            <EmailBody data-test={ThreadBlockDataTest.emailBody} isTransactional={!!isTransactional} ref={emailBodyRef}>
              <Suspense fallback={null}>
                <MailHTMLView
                  attachments={attachments}
                  email={email}
                  shouldBlockRemoteContent={shouldBlockRemoteContent}
                />
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
                void downloadAllAttachments(decryptedAttachmentMetadata, `${decryptedSubject ?? ''}-attachments.zip`);
              }}
            />
            {isMobile && <MobileWalletInfoContainer>{walletInfo}</MobileWalletInfoContainer>}
            {/* Forward, Reply Reply All on Browser */}
            {!isMobile && renderThreadActions && (
              <ActionsBlockContainer>
                {walletInfo}
                <ActionsContainer>
                  <Button icon={Icon.Reply} onClick={reply}>
                    Reply
                  </Button>
                  <Button icon={Icon.ReplyAll} onClick={replyAll} type={Type.SECONDARY}>
                    Reply all
                  </Button>
                  <Button icon={Icon.ForwardEmail} onClick={forward} type={Type.SECONDARY}>
                    Forward
                  </Button>
                </ActionsContainer>
              </ActionsBlockContainer>
            )}
          </ThreadBlockExpanded>
        )}
      </ThreadBlockContainer>
      <ThreadBlockDropdown
        buttonRef={moreButtonRef}
        currentLabel={currentLabel}
        defaultEmailAlias={defaultEmailAlias}
        email={email}
        emailAliases={emailAliases}
        open={showMoreOptions}
        quickAliases={quickAliases}
        setOpen={setShowMoreOptions}
        thread={thread}
        unsubscribeInfo={unsubscribeInfo}
      />
    </>
  );
}

export default React.memo(ThreadBlock);
