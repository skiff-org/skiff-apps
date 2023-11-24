import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import {
  Chip,
  Dropdown,
  DropdownItem,
  Facepile,
  FilledVariant,
  Icon,
  Icons,
  Layout,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { ConnectDragSource } from 'react-dnd';
import { useResizeDetector } from 'react-resize-detector';
import { excerptNormalizedQueryMatch } from 'skiff-front-search';
import { ActionIcon, WalletAliasWithName, useTheme } from 'skiff-front-utils';
import { VERIFIED_SKIFF_EMAILS } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
import { MailboxThreadInfo } from '../../../models/thread';
import { UserLabelAlias, UserLabelPlain, UserLabelQuickAlias } from '../../../utils/label';
import { MatchInfo } from '../../../utils/search/searchTypes';
import Checkbox from '../../Checkbox';
import { LinkedLabelChips } from '../../labels/LinkedLabelChips';
import SenderDisplayName from '../../shared/SenderDisplayName/SenderDisplayName';

import {
  ActionsContainer,
  AvatarContainer,
  ContentPreview,
  EmailBlock,
  EmailContentTop,
  EmailInfo,
  EmailSender,
  LabelsContainer,
  MessageCellContainer,
  StartBlock,
  UnreadIndicator,
  UnreadIndicatorWrapper
} from './MessageCell.styles';
import {
  renderScheduledSendLink,
  renderSendersWithQueryMatch,
  renderTextWithQueryMatch,
  useCellDate
} from './MessageCell.utils';
import { MessageCellActions } from './MessageCellActions';
import { MessageCellAvatar } from './MessageCellAvatar';
import { MessageCellTooltip } from './MessageCellTooltip';
import { getStackedFacepileSize } from './utils';

dayjs.extend(isToday);

const DraftLabel = styled.div<{ $includeMargin: boolean }>`
  ${(props) => (props.$includeMargin ? 'margin-left: 8px;' : '')}
`;

interface MessageCellProps {
  // content
  thread: MailboxThreadInfo;
  displayNames: string[];
  addresses: string[];
  facepileNames: string[];
  userLabels: Array<UserLabelPlain | UserLabelAlias | UserLabelQuickAlias> | null | undefined;
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  label: string;
  walletAliasesWithName: WalletAliasWithName[];
  // interaction
  active: boolean;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  emailID?: string;
  // checkbox props
  selected?: boolean;
  onSelectToggle?: (e: React.MouseEvent<Element, MouseEvent>) => void;
  renderDraftLabel?: boolean;
  dragRef?: ConnectDragSource;
  multiSelectOpen?: boolean;
  matchInfo?: MatchInfo;
  mailboxActions?: Omit<ActionIcon, 'tooltip'>[];
}

export const MessageCell = ({
  thread,
  displayNames,
  addresses,
  facepileNames,
  userLabels,
  subject,
  message,
  hasAttachment,
  label,
  walletAliasesWithName,
  active,
  onClick,
  emailID,
  selected = false,
  onSelectToggle,
  renderDraftLabel,
  dragRef,
  multiSelectOpen,
  matchInfo,
  mailboxActions
}: MessageCellProps) => {
  const { ref } = useResizeDetector();
  const { theme } = useTheme();
  const {
    threadID,
    emails,
    attributes: { systemLabels, read },
    emailsUpdatedAt: date
  } = thread;

  const hoveredThreadID = useAppSelector((state) => state.mailbox.hoveredThreadID);
  const [hover, setHover] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [customAnchor, setCustomAnchor] = useState<{ x: number; y: number } | null>(null);
  const { composeOpen } = useAppSelector((state) => state.modal);

  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null);
  const [hoverOverName, setHoverOverName] = useState(false);
  const [tooltipIndex, setTooltipIndex] = useState(0);
  const displayNameRef = React.useRef<HTMLDivElement>(null);
  const contactDisplayName = useDisplayNameFromAddress(addresses[0]);

  // replace first address with contact name if it exists
  const displayNamesWithContact = displayNames.map((displayName, index) => {
    if (index === 0) {
      return contactDisplayName ?? displayName;
    }
    return displayName;
  });

  const onHover = useCallback(() => {
    setHover(true);
  }, []);

  const offHover = useCallback(() => {
    setHover(false);
  }, []);

  useEffect(() => {
    if (!!hoveredThreadID) {
      setHover(hoveredThreadID === thread.threadID);
    }
  }, [hoveredThreadID]);

  const cellDate = useCellDate(date);

  const getFacepileColor = (isDarkMode: boolean) => {
    if (active) {
      return isDarkMode ? '#282828' : '#f0f0f0';
    }
    if (!read) {
      return isDarkMode ? '#242424' : '#ffffff';
    }
    if (hover && read) {
      return isDarkMode ? '#282828' : '#f0f0f0';
    }
    return isDarkMode ? '#1f1f1f' : 'var(--bg-l1-solid)';
  };
  const facepileColor = getFacepileColor(theme === ThemeMode.DARK);

  const handleRightClick = (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault(); // to prevent the default context menu from showing up

    if (onSelectToggle && !selected) {
      onSelectToggle(e);
    }
    setCustomAnchor({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  const isVerifiedAddress = addresses.length === 1 && !!addresses[0] && VERIFIED_SKIFF_EMAILS.includes(addresses[0]);

  const { top, left } = displayNameRef.current?.getBoundingClientRect() ?? { top: 0, left: 0 };
  // handle vertical overflow off the window from below
  const tooltipTop = Math.max(0, top + 180 > window.innerHeight ? top - 200 : top);

  const handleMouseEnter = () => {
    // Clear any existing timer when mouse enters again.
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    // Start a new timer to show the tooltip after 1 second.
    const timer = setTimeout(() => {
      setHoverOverName(true);
    }, 1000); // 1 second delay

    setHoverTimer(timer);
  };

  const handleMouseLeave = () => {
    // Clear any existing timer when mouse leaves.
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }

    // Start a new timer to hide the tooltip after 200ms.
    const timer = setTimeout(() => {
      setHoverOverName(false);
    }, 200); // 200ms delay

    setHoverTimer(timer);
  };

  const messageCellContent = (
    <>
      <EmailBlock transition={!!multiSelectOpen}>
        {onSelectToggle && (
          <Checkbox
            checked={selected}
            hover={hover}
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle(e);
            }}
            padding
          />
        )}
        <StartBlock onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
          <AvatarContainer hide={!facepileNames.length}>
            <Facepile
              background={facepileColor}
              layout={Layout.STACKED}
              size={getStackedFacepileSize(facepileNames.length)}
            >
              {facepileNames.map((senderName, index) => (
                <MessageCellAvatar
                  address={addresses[index]}
                  badgeBackground={facepileColor}
                  key={`${addresses[index] ?? ''}-${emailID || threadID}`}
                  messageID={emails[index]?.id}
                  senderName={senderName}
                />
              ))}
            </Facepile>
          </AvatarContainer>
          <EmailSender>
            {hoverOverName && !composeOpen && (
              <MessageCellTooltip
                addresses={addresses}
                badgeColor={getFacepileColor(true)}
                emailID={emailID}
                facepileNames={facepileNames}
                isVerifiedAddress={isVerifiedAddress}
                left={left}
                setHoverOverName={setHoverOverName}
                setTooltipIndex={setTooltipIndex}
                thread={thread}
                tooltipIndex={tooltipIndex}
                top={tooltipTop}
              />
            )}
            <SenderDisplayName
              color={read ? 'secondary' : 'primary'}
              isSilenced={emails[0]?.from.blocked || undefined}
              isVerified={isVerifiedAddress}
              notificationsMuted={emails.some((email) => email.notificationsTurnedOffForSender)}
              ref={displayNameRef}
              weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
            >
              {renderSendersWithQueryMatch(displayNamesWithContact, matchInfo)}
            </SenderDisplayName>
            {renderDraftLabel && (
              <Typography color='link'>
                <DraftLabel $includeMargin={!!displayNames.length}>Draft</DraftLabel>
              </Typography>
            )}
          </EmailSender>
        </StartBlock>
        {/* Prevent layout shift */}
        <UnreadIndicatorWrapper>
          <UnreadIndicator $cellTransition={false} $read={read} />
        </UnreadIndicatorWrapper>
        <ContentPreview>
          {subject && (
            <Typography
              color={read ? 'secondary' : 'primary'}
              minWidth='auto'
              weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
            >
              {renderTextWithQueryMatch(subject, matchInfo)}
            </Typography>
          )}
          {message && (
            <Typography color={read ? 'disabled' : 'secondary'}>
              <span>&nbsp;–&nbsp;</span>
              {renderTextWithQueryMatch(
                matchInfo ? excerptNormalizedQueryMatch(message, matchInfo) : message,
                matchInfo
              )}
            </Typography>
          )}
        </ContentPreview>
        <EmailInfo>
          <LabelsContainer>
            {hasAttachment && (
              <Icons color='disabled' dataTest='message-cell-attachment-icon' icon={Icon.PaperClip} size={Size.SMALL} />
            )}
            {!!userLabels?.length && (
              <LinkedLabelChips
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                }}
                size={Size.SMALL}
                threadID={threadID}
                userLabels={userLabels}
                walletAliasesWithName={walletAliasesWithName}
              />
            )}
            {renderScheduledSendLink(emails, systemLabels)}
            {emails.length > 1 && (
              <Chip
                color='secondary'
                icon={Icon.Reply}
                label={emails.length}
                size={Size.SMALL}
                variant={FilledVariant.UNFILLED}
              />
            )}
          </LabelsContainer>
          <EmailContentTop $hide={hover}>
            <Typography color='disabled' dataTest='message-cell-date' mono size={TypographySize.SMALL}>
              {cellDate}
            </Typography>
          </EmailContentTop>
        </EmailInfo>
      </EmailBlock>
      {hover && (
        <ActionsContainer>
          <MessageCellActions label={label} read={read} thread={thread} />
        </ActionsContainer>
      )}
    </>
  );

  return (
    <div
      id={emailID || threadID}
      onContextMenu={handleRightClick}
      onFocus={() => {}}
      onMouseLeave={offHover}
      onMouseOver={onHover}
      ref={dragRef}
      style={{ overflow: 'hidden' }}
    >
      <MessageCellContainer
        active={active}
        hover={hover}
        isDarkMode={theme === ThemeMode.DARK}
        onClick={(e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => {
          onClick(e);
          setHoverOverName(false);
        }}
        read={read}
        ref={ref}
      >
        {messageCellContent}
      </MessageCellContainer>
      {!!mailboxActions && (
        <Dropdown
          customAnchor={customAnchor || undefined}
          minWidth={206}
          portal
          setShowDropdown={setShowContextMenu}
          showDropdown={showContextMenu}
        >
          {mailboxActions.map((action) => (
            <DropdownItem
              icon={action.icon}
              key={action.label}
              label={action.label}
              onClick={() => {
                action.onClick();
                setShowContextMenu(false);
              }}
              ref={action.ref}
            />
          ))}
        </Dropdown>
      )}
    </div>
  );
};
