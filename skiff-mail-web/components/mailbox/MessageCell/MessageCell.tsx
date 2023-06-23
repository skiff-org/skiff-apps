import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import {
  Chip,
  Facepile,
  Icon,
  Icons,
  IconText,
  Layout,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { ConnectDragSource } from 'react-dnd';
import { useResizeDetector } from 'react-resize-detector';
import { useTheme } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useDate } from '../../../hooks/useDate';
import { MailboxThreadInfo } from '../../../models/thread';
import { UserLabelAlias, UserLabelPlain } from '../../../utils/label';
import { getScheduledSendAtDateForThread } from '../../../utils/mailboxUtils';
import Checkbox from '../../Checkbox';
import { LinkedLabelChips } from '../../labels/LinkedLabelChips';

import { useDisplayNameFromAddress } from '../../../hooks/useDisplayNameFromAddress';
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
import { MessageCellActions } from './MessageCellActions';
import { MessageCellAvatar } from './MessageCellAvatar';
import { getSenders, getStackedFacepileSize } from './utils';

dayjs.extend(isToday);

const DraftLabel = styled.div<{ $includeMargin: boolean }>`
  ${(props) => (props.$includeMargin ? 'margin-left: 8px;' : '')}
`;

const SearchText = styled.span`
  color: var(--icon-link);
`;

const ScheduledSendLinkContainer = styled.div`
  order: 1;
`;

interface MessageCellProps {
  // content
  thread: MailboxThreadInfo;
  displayNames: string[];
  addresses: string[];
  facepileNames: string[];
  userLabels: Array<UserLabelPlain | UserLabelAlias> | null | undefined;
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  label: string;
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
  query?: string;
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
  active,
  onClick,
  emailID,
  selected = false,
  onSelectToggle,
  renderDraftLabel,
  dragRef,
  multiSelectOpen,
  query
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
  const contactDisplayName = useDisplayNameFromAddress(addresses[0]);
  // repalce first address with contact name if it exists
  const displayNamesWithContact = displayNames.map((displayName, index) => {
    if (index === 0) {
      return contactDisplayName ?? displayName;
    }
    return displayName;
  });
  const { getMonthAndDay, getTime, getTimeAndDate } = useDate();

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

  const getCellDate = () => (dayjs(date).isToday() ? getTime(date) : getMonthAndDay(date));

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

  const renderTextWithQueryMatch = (text: string) => {
    const matchIndex = text.toLowerCase().indexOf(query?.toLowerCase() ?? '');

    return query && matchIndex >= 0 ? (
      <>
        <span>{text.slice(0, matchIndex)}</span>
        <SearchText>{text.slice(matchIndex, matchIndex + query.length)}</SearchText>
        <span>{text.slice(matchIndex + query.length)}</span>
      </>
    ) : (
      text
    );
  };

  const renderScheduledSendLink = () => {
    const sendAtDate = getScheduledSendAtDateForThread(emails);

    return (
      <ScheduledSendLinkContainer>
        {systemLabels.includes(SystemLabels.ScheduleSend) && sendAtDate && (
          <IconText
            color='link'
            label={getTimeAndDate(sendAtDate)}
            startIcon={<Icons color='link' icon={Icon.Clock} />}
            weight={TypographyWeight.REGULAR}
          />
        )}
      </ScheduledSendLinkContainer>
    );
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
        <StartBlock>
          <AvatarContainer hide={!facepileNames.length}>
            <Facepile
              background={facepileColor}
              layout={Layout.STACKED}
              size={getStackedFacepileSize(facepileNames.length)}
            >
              {facepileNames.map((senderName, index) => (
                <MessageCellAvatar
                  address={addresses[index]}
                  key={`${addresses[index]}-${emailID || threadID}`}
                  senderName={senderName}
                />
              ))}
            </Facepile>
          </AvatarContainer>
          <EmailSender>
            <Typography
              color={read ? 'secondary' : 'primary'}
              weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
            >
              {renderTextWithQueryMatch(getSenders(displayNamesWithContact))}
            </Typography>
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
              {renderTextWithQueryMatch(subject)}
            </Typography>
          )}
          {message && (
            <Typography color={read ? 'disabled' : 'secondary'}>
              <span>&nbsp;–&nbsp;</span>
              {renderTextWithQueryMatch(message)}
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
              />
            )}
            {renderScheduledSendLink()}
            {emails.length > 1 && (
              <Chip label={emails.length} size={Size.SMALL} startIcon={<Icons color='secondary' icon={Icon.Reply} />} />
            )}
          </LabelsContainer>
          <EmailContentTop $hide={hover}>
            <Typography color='disabled' dataTest='message-cell-date' mono size={TypographySize.SMALL}>
              {getCellDate()}
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
        onClick={onClick}
        read={read}
        ref={ref}
      >
        {messageCellContent}
      </MessageCellContainer>
    </div>
  );
};
