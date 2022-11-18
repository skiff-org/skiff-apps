import { Typography } from 'nightwatch-ui';
import { FC, RefObject, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { isWalletAddress, splitEmailToAliasAndDomain } from 'skiff-front-utils';
import { isENSName } from 'skiff-utils';
import styled from 'styled-components';

import { MailboxEmailInfo } from '../../models/email';

import RecipientDetails from './ContactDetails/RecipientDetails';
import { SenderDetails } from './ContactDetails/SenderDetails';

const ThreadBlockHeaderContainer = styled.div<{ disabled: boolean }>`
  display: flex;
  padding: 16px 0;
  height: fit-content;
  cursor: ${(props) => (props.disabled ? 'auto' : 'pointer')};
  border-radius: 8px;
  gap: 8px;
  ${isMobile && 'padding: 16px;'}
`;

const getHeaderPreviewTopMargin = (renderDisplayName: boolean, isWallet: boolean) => {
  if (renderDisplayName) {
    if (isWallet) return 4;
    return isMobile ? -16 : 0;
  }
  if (isMobile) {
    return isWallet ? -12 : -16;
  }
  return -8;
};

const HeaderPreview = styled.div<{
  $isExpanded: boolean;
  $showContacts: boolean;
  $isWalletAddress: boolean;
  $renderDisplayName: boolean;
}>`
  width: calc(100% - 72px);
  margin-left: 44px;
  ${(props) => `margin-top: ${getHeaderPreviewTopMargin(props.$renderDisplayName, props.$isWalletAddress)}px;`}
  padding: 0 8px;
  border-radius: 8px;
  pointer-events: ${(props) => (props.$isExpanded ? 'all' : 'none')};
  &:hover {
    background: ${(props) => (isMobile ? 'initial' : props.$showContacts ? 'transparent' : 'var(--bg-cell-hover)')};
    cursor: ${(props) => (isMobile ? 'initial' : props.$showContacts ? 'default' : 'pointer')};
  }
  ${(props) => (props.$showContacts ? `overflow-x: scroll` : '')}
  ${isMobile
    ? `
        overflow: hidden;
      `
    : ''}
`;

const SubjectBlock = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 4px;
`;

// Un-setting min-width to make sure the subject label is not hidden
const SubjectLabel = styled(Typography)`
  &.outerText {
    min-width: unset;
  }
`;

const AvatarAndContacts = styled.div`
  width: 100%;
`;
interface ThreadBlockHeaderProps {
  email: MailboxEmailInfo;
  // Whether to disable expanding / collapsing on click (for the most recent email)
  disableOnClick: boolean;
  // Handler when user clicks on the block
  onClick: (id: string, evt?: React.MouseEvent) => void;
  moreButtonRef: RefObject<HTMLDivElement>;
  // Whether the thread content is expanded
  expanded: boolean;
  setShowMoreOptions: (showMoreOptions: boolean) => void;
}

export const ThreadBlockHeaderDataTest = {
  externalLinkBtn: 'external-link-btn'
};

export const ThreadBlockHeader: FC<ThreadBlockHeaderProps> = ({
  email,
  disableOnClick,
  onClick,
  moreButtonRef,
  expanded,
  setShowMoreOptions
}) => {
  const { decryptedSubject, from } = email;
  const { address: fromAddress, name: fromDisplayName } = from;

  const [showContacts, setShowContacts] = useState(false);

  const threadHeaderRef: React.MutableRefObject<HTMLDivElement | null> = useRef(null);

  const [fromAlias] = splitEmailToAliasAndDomain(fromAddress);
  const isWalletEmail = isWalletAddress(fromAlias) || isENSName(fromAlias);

  const handleClickOutside = (evt: MouseEvent) => {
    if (threadHeaderRef.current) {
      const insideWrapper = threadHeaderRef.current?.contains(evt.target as Node) || false;
      evt.stopPropagation();
      if (!insideWrapper && !isMobile) {
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

  const onThreadBlockHeaderClick = (evt?: React.MouseEvent<Element, MouseEvent>) => {
    // Pass email id and click event to memoized onClick function
    onClick(email.id, evt);
  };

  return (
    <ThreadBlockHeaderContainer
      disabled={disableOnClick}
      onClick={disableOnClick ? undefined : onThreadBlockHeaderClick}
      ref={threadHeaderRef}
    >
      <AvatarAndContacts>
        <SenderDetails
          email={email}
          expanded={expanded}
          moreButtonRef={moreButtonRef}
          setShowMoreOptions={setShowMoreOptions}
          showContacts={showContacts}
        />
        <HeaderPreview
          $isExpanded={expanded}
          $isWalletAddress={isWalletEmail}
          $renderDisplayName={!!fromDisplayName}
          $showContacts={showContacts}
          onClick={(evt: React.MouseEvent) => {
            evt.stopPropagation();
            setShowContacts(true);
          }}
        >
          <RecipientDetails email={email} expanded={expanded} showContacts={showContacts} />
          {expanded && (!isMobile || showContacts) && (
            <SubjectBlock>
              <SubjectLabel color='secondary'>Subject:</SubjectLabel>
              <Typography color={showContacts ? 'primary' : 'secondary'} wrap={showContacts}>
                {decryptedSubject}
              </Typography>
            </SubjectBlock>
          )}
        </HeaderPreview>
      </AvatarAndContacts>
    </ThreadBlockHeaderContainer>
  );
};
