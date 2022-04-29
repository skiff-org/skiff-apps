import { Avatar, Button, Icon, IconButton, Typography } from '@skiff-org/skiff-ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isMobile, MobileView } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useDrafts } from '../../hooks/useDrafts';
import { MailboxEmailInfo } from '../../models/email';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailBottomToolbarReducer } from '../../redux/reducers/bottomToolbarReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { PopulateComposeContent, PopulateComposeTypes, skemailModalReducer } from '../../redux/reducers/modalReducer';
import { Attachments, useAttachments, useDownloadAttachments } from '../Attachments';
import { ThreadToolbar } from '../shared/BottomToolbars';
import ContactDetails from './ContactDetails/ContactDetails';
import { MailHTMLView } from './MailHTMLView';
import { ThreadBlockDropdown } from './ThreadBlockDropdown';
import ThreadShowMoreButton from './ThreadShowMoreButton';

const ThreadBlockContainer = styled.div`
  width: 580px;
  ${isMobile ? 'width: 100%;' : ''}
`;

const ThreadBlockHeader = styled.div<{ disabled: boolean }>`
  display: flex;
  align-items: flex-start;
  padding: 16px 0;
  height: fit-content;
  cursor: ${(props) => (props.disabled ? 'auto' : 'pointer')};
  border-radius: 8px;
  gap: 8px;
`;

const HeaderPreview = styled.div<{ expanded: boolean; showContacts: boolean }>`
  text-align: left;
  max-width: 380px;
  padding: 0 8px;
  border-radius: 8px;
  pointer-events: ${(props) => (props.expanded ? 'all' : 'none')};
  &:hover {
    background: ${(props) => (props.showContacts ? 'transparent' : 'var(--bg-cell-hover)')};
    cursor: ${(props) => (props.showContacts ? 'default' : 'pointer')};
  }
  ${isMobile
    ? `
        width: 100%;
        overflow: hidden;
      `
    : ''}
`;

const HeaderDate = styled(Typography)`
  padding-top: 8px;
  margin-left: auto;
  min-width: fit-content;
`;

const ThreadBlockExpanded = styled.div`
  display: flex;
  flex-direction: column;
`;

const EmailBody = styled.div<{ limitHeight: boolean }>`
  padding: 24px 0;
  color: var(--text-primary);
  ${isMobile
    ? `
        padding: 0;
        overflow: hidden;
      `
    : ''}
  max-height: ${(props) => (props.limitHeight ? '320px' : 'none')};
`;

const ActionsContainer = styled.div`
  margin: 24px 0;
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SubjectBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const AvatarBlock = styled.div`
  padding-top: 8px;
`;

const MobileReplyContainer = styled.div`
  display: flex;
  flex-direction: row-reverse;
  width: 100%;
  margin-bottom: 16px;
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
  onClick: (evt?: React.MouseEvent) => void;
  onClose: () => void;
};

/**
 * Component to render a single email in a thread.
 */
export default function ThreadBlock(props: ThreadBlockProps) {
  const { expanded, disableOnClick, onClick, email, thread, onClose } = props;
  const { createdAt, from, decryptedSubject, decryptedText, decryptedAttachmentMetadata } = email;

  const [showContacts, setShowContacts] = useState(false);
  const { downloadAllAttachments, downloadAttachment, isDownloadingAttachments } =
    useDownloadAttachments(decryptedAttachmentMetadata);
  const { composeNewDraft } = useDrafts();

  // Redux actions
  const dispatch = useDispatch();
  const openCompose = useCallback(
    (populateComposeContent: PopulateComposeContent) => {
      composeNewDraft();
      dispatch(skemailModalReducer.actions.openCompose({ populateComposeContent }));
    },
    [composeNewDraft, dispatch]
  );
  const setCurrentEmail = (curEmail: MailboxEmailInfo) => {
    dispatch(skemailMobileDrawerReducer.actions.setCurrentEmail(curEmail));
  };

  const sender = from.name ?? from.address;
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  const threadHeaderRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);
  const emailBodyRef = useRef<HTMLDivElement>(null);
  const [limitEmailHeight, setLimitEmailHeight] = useState(isMobile);

  const handleClickOutside = (evt: MouseEvent) => {
    if (threadHeaderRef.current) {
      const insideWrapper = threadHeaderRef.current?.contains(evt.target as Node) || false;
      evt.stopPropagation();
      if (!insideWrapper) {
        setShowContacts(false);
      }
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const onReplyClick = useCallback(() => {
    openCompose({ type: PopulateComposeTypes.Reply, email, thread });
  }, [email, thread, openCompose]);

  useEffect(() => {
    // Show threads toolbar on mobile
    if (isMobile) {
      dispatch(
        skemailBottomToolbarReducer.actions.setContent(<ThreadToolbar onReplyClick={onReplyClick} thread={thread} />)
      );
    }
  }, []);

  const dateAndActionsButton = (
    <>
      <HeaderDate color='tertiary' level={3} type='paragraph'>
        {dayjs(createdAt).format(isMobile ? 'MMM D' : 'MMM D, h:mm A')}
      </HeaderDate>
      {expanded && (!isMobile || expanded) && (
        <IconButton
          color='secondary'
          icon={Icon.OverflowH}
          onClick={(e) => {
            e.stopPropagation();
            setCurrentEmail(email); // set the email in the more options drawer to the current email
            setShowMoreOptions(true);
          }}
          ref={moreButtonRef}
        />
      )}
    </>
  );

  const { attachments } = useAttachments(decryptedAttachmentMetadata);

  return (
    <>
      <ThreadBlockContainer data-test='thread-block'>
        <ThreadBlockHeader
          disabled={disableOnClick}
          onClick={disableOnClick ? undefined : onClick}
          ref={threadHeaderRef}
        >
          <AvatarBlock>
            <Avatar label={sender} />
          </AvatarBlock>
          <HeaderPreview
            expanded={expanded}
            onClick={(evt: React.MouseEvent) => {
              if (!isMobile) {
                evt.stopPropagation();
                setShowContacts(true);
              }
            }}
            showContacts={showContacts}
          >
            <ContactDetails
              dateAndActions={dateAndActionsButton}
              email={email}
              expanded={expanded}
              showContacts={showContacts}
            />
            {expanded && !isMobile && (
              <SubjectBlock>
                <Typography color='secondary' type='paragraph'>
                  Subject:
                </Typography>
                <Typography color={showContacts ? 'primary' : 'secondary'} type='paragraph'>
                  {decryptedSubject}
                </Typography>
              </SubjectBlock>
            )}
          </HeaderPreview>
          {/* On Browser View Display the Date and Actions Components After the header preview */}
          {!isMobile && dateAndActionsButton}
        </ThreadBlockHeader>
        {expanded && decryptedText && (
          <ThreadBlockExpanded data-test='thread-block-expanded'>
            <EmailBody limitHeight={limitEmailHeight} ref={emailBodyRef}>
              <MailHTMLView email={email} />
            </EmailBody>
            {/* Show more button on Mobile */}
            {isMobile && (
              <ThreadShowMoreButton
                limitHeight={limitEmailHeight}
                setLimitHeight={setLimitEmailHeight}
                threadRef={emailBodyRef}
              />
            )}
            <Attachments
              attachments={attachments}
              isDownloadingAttachments={isDownloadingAttachments}
              onDownload={async (id) => {
                if (!decryptedAttachmentMetadata) return;

                const meta = decryptedAttachmentMetadata.find(({ attachmentID }) => attachmentID === id);
                if (!meta || !meta.decryptedMetadata?.contentType) return;

                void downloadAttachment(id, meta.decryptedMetadata?.contentType, meta.decryptedMetadata?.filename);
              }}
              onDownloadAll={() => {
                void downloadAllAttachments(decryptedAttachmentMetadata, `${decryptedSubject}-attachments.zip`);
              }}
            />
            {/* Forward, Reply Reply All on Browser */}
            {!isMobile && (
              <ActionsContainer>
                <Button onClick={onReplyClick} startIcon={Icon.Reply} type='secondary'>
                  Reply
                </Button>
                <Button
                  onClick={() => {
                    openCompose({ type: PopulateComposeTypes.ReplyAll, email, thread });
                  }}
                  startIcon={Icon.ReplyAll}
                  type='secondary'
                >
                  Reply all
                </Button>
                <Button
                  onClick={() => {
                    openCompose({ type: PopulateComposeTypes.Forward, email, thread });
                  }}
                  startIcon={Icon.ForwardEmail}
                  type='secondary'
                >
                  Forward
                </Button>
              </ActionsContainer>
            )}
            <MobileView>
              <MobileReplyContainer>
                <IconButton icon={Icon.Reply} onClick={onReplyClick} size='large' type='filled' />
              </MobileReplyContainer>
            </MobileView>
          </ThreadBlockExpanded>
        )}
      </ThreadBlockContainer>
      <ThreadBlockDropdown
        buttonRef={moreButtonRef}
        email={email}
        onClose={onClose}
        open={showMoreOptions}
        setOpen={setShowMoreOptions}
        thread={thread}
      />
    </>
  );
}
