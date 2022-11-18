import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import Link from 'next/link';
import { Chip, Facepile, Icon, Icons, IconText, Typography } from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { ConnectDragSource } from 'react-dnd';
import { useResizeDetector } from 'react-resize-detector';
import { useTheme } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useDate } from '../../../hooks/useDate';
import { MailboxThreadInfo } from '../../../models/thread';
import { getUrlFromUserLabelAndThreadID, UserLabel } from '../../../utils/label';
import Checkbox from '../../Checkbox';

import {
  ActionsContainer,
  AvatarContainer,
  ContentPreview,
  EmailBlock,
  EmailContentTop,
  EmailInfo,
  EmailMessage,
  EmailSender,
  EmailSubject,
  LabelsContainer,
  MessageCellContainer,
  Senders,
  StartBlock,
  UnreadIndicator,
  UnreadIndicatorWrapper
} from './MessageCell.styles';
import { MessageCellActions } from './MessageCellActions';
import { MessageCellAvatar } from './MessageCellAvatar';
import { getSenders } from './utils';

dayjs.extend(isToday);

const DraftLabel = styled(Typography)<{ includeMargin: boolean }>`
  ${(props) => (props.includeMargin ? 'margin-left: 8px;' : '')}
`;

const SearchText = styled.span`
  color: var(--icon-link);
`;

interface MessageCellProps {
  // content
  thread: MailboxThreadInfo;
  displayNames: string[];
  addresses: string[];
  facepileNames: string[];
  userLabels: Array<UserLabel> | null | undefined;
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

  const getCellDate = () => (dayjs(date as Date).isToday() ? getTime(date as Date) : getMonthAndDay(date as Date));

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
  const facepileColor = getFacepileColor(theme === 'dark');

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
          />
        )}
        <StartBlock>
          <AvatarContainer hide={!facepileNames.length}>
            <Facepile background={facepileColor} isMobile>
              {facepileNames.map((senderName, index) => (
                <MessageCellAvatar
                  address={addresses[index]}
                  key={`${addresses[index]}-${emailID || threadID}`}
                  numAvatars={facepileNames.length}
                  senderName={senderName}
                />
              ))}
            </Facepile>
          </AvatarContainer>
          <EmailSender>
            <Senders color={read ? 'secondary' : 'primary'} level={2} type={read ? 'paragraph' : 'label'}>
              {renderTextWithQueryMatch(getSenders(displayNames))}
            </Senders>
            {renderDraftLabel && (
              <DraftLabel color='link' includeMargin={!!displayNames.length} level={2}>
                Draft
              </DraftLabel>
            )}
          </EmailSender>
        </StartBlock>
        {/* Prevent layout shift */}
        <UnreadIndicatorWrapper>
          <UnreadIndicator
            $cellTransition={false}
            $read={false}
            animate={{
              opacity: !read ? [0, 1, 1] : 0,
              scale: !read ? [1, 1.2, 1] : 1
            }}
            exit={{
              opacity: 0,
              scale: 0.5
            }}
            initial={false}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 30,
              duration: 0.5
            }}
          />
        </UnreadIndicatorWrapper>
        <ContentPreview>
          {subject && (
            <EmailSubject color={read ? 'secondary' : 'primary'} type={read ? 'paragraph' : 'label'}>
              {renderTextWithQueryMatch(subject)}
            </EmailSubject>
          )}
          {message && (
            <EmailMessage color={read ? 'disabled' : 'secondary'}>
              <span>&nbsp;–&nbsp;</span>
              {renderTextWithQueryMatch(message)}
            </EmailMessage>
          )}
        </ContentPreview>
        <EmailInfo>
          <LabelsContainer>
            {hasAttachment && (
              <Icons color='disabled' dataTest='message-cell-attachment-icon' icon={Icon.PaperClip} size='small' />
            )}
            {userLabels?.map((userLabel) => {
              const encodedLabelName = encodeURIComponent(userLabel.name.toLowerCase());
              // clicking on the label should
              // - redirect to label inbox on mobile
              // - redirect to label inbox with opened thread on desktop
              const mobileUrl = `/label#${encodedLabelName}`;
              const desktopUrl = getUrlFromUserLabelAndThreadID(userLabel.name, threadID);
              return (
                <Link href={isMobile ? mobileUrl : desktopUrl} key={userLabel.value} passHref>
                  <Chip
                    key={userLabel.value}
                    label={userLabel.name}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      console.log('hit');
                    }}
                    size='small'
                    startIcon={<Icons color={userLabel.color} icon={Icon.Dot} />}
                  />
                </Link>
              );
            })}
            <div style={{ order: 1 }}>
              {systemLabels.includes(SystemLabels.ScheduleSend) && (
                <IconText
                  color='link'
                  label={getTimeAndDate(emails[0].scheduleSendAt as Date)}
                  startIcon={<Icons color='link' icon={Icon.Clock} />}
                  type='paragraph'
                />
              )}
            </div>
            {emails.length > 1 && (
              <Chip label={emails.length} size='small' startIcon={<Icons color='secondary' icon={Icon.Reply} />} />
            )}
          </LabelsContainer>
          <EmailContentTop $hide={hover}>
            <Typography color='disabled' dataTest='message-cell-date' level={3} mono>
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
        isDarkMode={theme === 'dark'}
        onClick={onClick}
        read={read}
        ref={ref}
      >
        {messageCellContent}
      </MessageCellContainer>
    </div>
  );
};
