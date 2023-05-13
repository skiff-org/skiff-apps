import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import range from 'lodash/range';
import {
  Button,
  Icon,
  Icons,
  ThemeMode,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  abbreviateWalletAddress,
  isWalletLookupSupported,
  proxyAttributes,
  rewriteCSSAttribute,
  splitEmailToAliasAndDomain,
  useTheme,
  useUserPreference
} from 'skiff-front-utils';
import { StorageTypes, isENSName } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useDrafts } from '../../hooks/useDrafts';
import { useUserSignature } from '../../hooks/useUserSignature';
import { MailboxEmailInfo, ThreadViewEmailInfo } from '../../models/email';
import { ThreadDetailInfo } from '../../models/thread';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { openWalletLookupLink } from '../../utils/walletUtils/walletUtils';
import { Attachments, useAttachments } from '../Attachments';
import { getEmailBody } from '../MailEditor/mailEditorUtils';

import Pixelated from './Pixelated/Pixelated';
import { ThreadBlockDropdown } from './ThreadBlockDropdown';
import { ThreadBlockHeader } from './ThreadBlockHeader';

const MailHTMLView = React.lazy(() => import('./MailHTMLView/MailHTMLView'));
const MAX_PIXELATED_DISPLAY = 2;
const ThreadBlockContainer = styled.div<{ expanded: boolean; isDarkMode?: boolean }>`
  width: 100%;
  // box-shadow: ${(props) => (!props.isDarkMode ? 'var(--shadow-l1)' : '')};
  ${isMobile &&
  css`
    border-bottom: 1px solid var(--border-tertiary);
  `}
  ${!isMobile &&
  css`
    border: 1px solid var(--border-secondary);
  `}
  background: var(--bg-l2-solid);
  &:hover {
    box-shadow: ${(props) => (!props.expanded ? 'var(--shadow-l1)' : '')};
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

const BlockedContentContainer = styled.div`
  display: flex;
  padding: 4px;
  isolation: isolate;
  margin-left: 48px;
  width: fit-content;
  border: 1.5px solid var(--border-secondary);
  border-radius: 18px;
`;

const OverflowContent = styled.div<{ $isDarkMode: boolean }>`
  user-select: none;
  display: flex;
  padding: 4px;
  isolation: isolate;
  background: var(--bg-overlay-secondary);
  justify-content: center;
  align-items: center;
  margin-left: -12px;
  border: 3px solid ${(props) => (props.$isDarkMode ? '#242424' : 'white')};
  box-sizing: border-box;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  z-index: 0;
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

const PixelatedContainer = styled.div`
  margin-left: 12px;
  cursor: pointer;
  display: flex;
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
  const { disableOnClick, expanded, email, thread, onClick, currentLabel, defaultEmailAlias, emailAliases } = props;
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

  const emailContainsRemoteContent = useMemo(() => {
    return doesEmailContainRemoteContent(email, new URL(window.location.origin));
  }, [email]);
  const [disableRemoteContentDefault] = useUserPreference(StorageTypes.BLOCK_REMOTE_CONTENT);
  // if no remote content, do not disable it
  const [disableRemoteContent, setDisableRemoteContent] = useState<boolean>(
    emailContainsRemoteContent.containsRemoteContent ? disableRemoteContentDefault ?? false : false
  );

  useEffect(() => {
    // set load remote content back to default when thread changes
    setDisableRemoteContent(
      emailContainsRemoteContent.containsRemoteContent ? disableRemoteContentDefault ?? false : false
    );
  }, [thread, disableRemoteContentDefault, emailContainsRemoteContent]);

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
        data-test={ThreadBlockDataTest.threadBlock}
        expanded={expanded}
        isDarkMode={theme === ThemeMode.DARK}
      >
        <ThreadBlockHeader
          disableOnClick={disableOnClick}
          email={email}
          expanded={expanded}
          moreButtonRef={moreButtonRef}
          onClick={onClick}
          reply={() => reply()}
          setShowMoreOptions={setShowMoreOptions}
        />
        {expanded && (
          <ThreadBlockExpanded data-test={ThreadBlockDataTest.threadBlockExpanded}>
            {disableRemoteContent && (
              <>
                <FloatingDelayGroup delay={{ open: 0, close: 200 }}>
                  <Tooltip>
                    <TooltipContent>
                      <Typography
                        color='secondary'
                        forceTheme={ThemeMode.DARK}
                        size={TypographySize.CAPTION}
                        weight={TypographyWeight.MEDIUM}
                      >
                        {`${numBlocked} ${numBlocked === 1 ? 'image' : 'images'} blocked `}
                        <Typography
                          forceTheme={ThemeMode.DARK}
                          size={TypographySize.CAPTION}
                          weight={TypographyWeight.MEDIUM}
                        >
                          Click to load
                        </Typography>
                      </Typography>
                    </TooltipContent>
                    <BlockedContentContainer>
                      <TooltipTrigger>
                        <PixelatedContainer
                          onClick={() => {
                            setDisableRemoteContent(false);
                          }}
                        >
                          {range(emailContainsRemoteContent.numProxy).map((_, index) => {
                            if (index < MAX_PIXELATED_DISPLAY) {
                              return <Pixelated blocks={4} size={36} zIndex={MAX_PIXELATED_DISPLAY - index} />;
                            }
                          })}
                          {emailContainsRemoteContent.numProxy > MAX_PIXELATED_DISPLAY && (
                            <OverflowContent $isDarkMode={theme === ThemeMode.DARK}>
                              <Typography
                                color='disabled'
                                mono
                                size={TypographySize.SMALL}
                                weight={TypographyWeight.MEDIUM}
                              >
                                {`+${emailContainsRemoteContent.numProxy - MAX_PIXELATED_DISPLAY}`}
                              </Typography>
                            </OverflowContent>
                          )}
                        </PixelatedContainer>
                      </TooltipTrigger>
                    </BlockedContentContainer>
                  </Tooltip>
                </FloatingDelayGroup>
              </>
            )}
            <EmailBody data-test={ThreadBlockDataTest.emailBody} isTransactional={!!isTransactional} ref={emailBodyRef}>
              <Suspense fallback={null}>
                <MailHTMLView attachments={attachments} disableRemoteContent={disableRemoteContent} email={email} />
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
            {!isMobile && (
              <ActionsBlockContainer>
                {walletInfo}
                <ActionsContainer>
                  <Button onClick={reply} startIcon={Icon.Reply}>
                    Reply
                  </Button>
                  <Button onClick={replyAll} startIcon={Icon.ReplyAll} type={Type.SECONDARY}>
                    Reply all
                  </Button>
                  <Button onClick={forward} startIcon={Icon.ForwardEmail} type={Type.SECONDARY}>
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
        setOpen={setShowMoreOptions}
        thread={thread}
      />
    </>
  );
}

export default React.memo(ThreadBlock);
