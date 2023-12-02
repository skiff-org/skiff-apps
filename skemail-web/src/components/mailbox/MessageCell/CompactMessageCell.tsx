import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { Icon, Icons, Size, ThemeMode, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { useCallback, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { excerptNormalizedQueryMatch } from 'skiff-front-search';
import { Checkbox, WalletAliasWithName, useTheme } from 'skiff-front-utils';
import { VERIFIED_SKIFF_EMAILS } from 'skiff-utils';
import styled from 'styled-components';

import { COMPACT_ITEM_HEIGHT } from '../../../constants/mailbox.constants';
import { MailboxThreadInfo } from '../../../models/thread';
import { UserLabelAlias, UserLabelPlain, UserLabelQuickAlias } from '../../../utils/label';
import { MatchInfo } from '../../../utils/search/searchTypes';
import { LabelChip } from '../../labels/LabelChip';

import { ConnectDragSource } from 'react-dnd';
import { LabelsContainer, UnreadIndicator } from './MessageCell.styles';
import {
  renderScheduledSendLink,
  renderSendersWithQueryMatch,
  renderTextWithQueryMatch,
  useCellDate
} from './MessageCell.utils';
import { MessageCellActions } from './MessageCellActions';

dayjs.extend(isToday);

export interface CompactMessageCellProps {
  read: boolean;
  addresses: string[];
  displayNames: string[];
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  date: Date;
  label: string;
  walletAliasesWithName: WalletAliasWithName[];
  // interaction
  active: boolean;
  selected?: boolean;
  numEmails?: number;
  userLabels?: Array<UserLabelPlain | UserLabelAlias | UserLabelQuickAlias> | null | undefined;
  onSelectToggle: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  thread: MailboxThreadInfo;
  matchInfo?: MatchInfo;
  dragRef?: ConnectDragSource;
}

const CompactMessageCellContainer = styled.div<{
  read: boolean;
  isDarkMode: boolean;
  active: boolean;
}>`
  display: flex;
  align-items: flex-start;
  width: 100%;
  box-sizing: border-box;
  height: ${COMPACT_ITEM_HEIGHT}px;
  padding: 12px 18px;
  padding-right: 0px;
  border-bottom: 1px solid var(--border-tertiary);
  background: ${(props) =>
    props.read ? (props.active ? 'var(--bg-overlay-tertiary)' : 'transparent') : 'var(--bg-l2-solid)'};
  overflow: hidden;
  user-select: none;
  gap: 16px;
  cursor: pointer;
  :hover {
    background: ${(props) => (props.read || props.active ? 'var(--bg-overlay-tertiary)' : 'var(--bg-l1-solid)')};
  }
`;

const CheckboxContainer = styled.div`
  padding: 2px;
`;

const Text = styled.div`
  display: flex;
  width: calc(100% - 48px);
  flex-direction: column;
`;

const SenderVerified = styled.div`
  display: flex;
  align-items: center;
  gap: 1px;
`;

const SenderUnread = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
`;

const MessageChips = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  height: 10px;
`;

export const CompactMessageCell = ({
  read,
  label,
  displayNames,
  addresses,
  subject,
  message,
  hasAttachment,
  date,
  walletAliasesWithName,
  selected = false,
  active,
  numEmails,
  userLabels,
  onSelectToggle,
  onClick,
  thread,
  matchInfo,
  dragRef
}: CompactMessageCellProps) => {
  const { ref } = useResizeDetector();
  const { theme } = useTheme();

  const {
    emails,
    attributes: { systemLabels }
  } = thread || { emails: [], attributes: { systemLabels: [] } };

  const [hover, setHover] = useState(false);
  const onHover = useCallback(() => {
    setHover(true);
  }, []);

  const offHover = useCallback(() => {
    setHover(false);
  }, []);

  const cellDate = useCellDate(date);

  // always defined with defaults

  const renderUserLabelChips = () => {
    if (!userLabels?.length) return null;
    return (
      <LabelsContainer>
        {userLabels?.map((userLabel) => {
          const { value } = userLabel;
          return (
            <LabelChip
              // if there are less than 3 user labels, use the default calculated
              // labelName in LabelChip. We hide the label name if there an three
              // or more labels.
              customLabelName={userLabels.length < 3 ? undefined : ''}
              key={value}
              size={Size.X_SMALL}
              userLabel={userLabel}
              walletAliasesWithName={walletAliasesWithName}
            />
          );
        })}
      </LabelsContainer>
    );
  };
  const isVerifiedAddress = addresses.length === 1 && !!addresses[0] && VERIFIED_SKIFF_EMAILS.includes(addresses[0]);

  return (
    <div ref={dragRef}>
      <CompactMessageCellContainer
        active={active}
        isDarkMode={theme === ThemeMode.DARK}
        onClick={onClick}
        onMouseLeave={offHover}
        onMouseOver={onHover}
        read={read}
        ref={ref}
      >
        <CheckboxContainer>
          <Checkbox
            checked={selected}
            onClick={(e) => {
              e.stopPropagation();
              onSelectToggle(e);
            }}
          />
        </CheckboxContainer>
        <Text>
          <SenderUnread>
            <SenderVerified>
              <Typography
                color={read ? 'secondary' : 'primary'}
                size={TypographySize.SMALL}
                weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
              >
                {renderSendersWithQueryMatch(displayNames, matchInfo)}
              </Typography>
              {isVerifiedAddress && (
                <Icons color='link' icon={Icon.VerifiedCheck} size={14} tooltip='Skiff official' tooltipDelay={0} />
              )}
            </SenderVerified>
            {numEmails && numEmails > 1 && (
              <Typography color='disabled' mono size={TypographySize.SMALL}>
                {numEmails}
              </Typography>
            )}
            <UnreadIndicator $cellTransition={false} $read={read} />
            <RightSection>
              {hasAttachment && (
                <Icons
                  color='secondary'
                  dataTest='message-cell-attachment-icon'
                  icon={Icon.PaperClip}
                  size={Size.X_SMALL}
                />
              )}
              {hover && (
                <ActionsContainer>
                  <MessageCellActions isCompact label={label} read={read} thread={thread} />
                </ActionsContainer>
              )}
              {!hover && (
                <Typography color='secondary' dataTest='message-cell-date' size={TypographySize.CAPTION}>
                  {cellDate}
                </Typography>
              )}
            </RightSection>
          </SenderUnread>
          {subject && (
            <Typography
              color={read ? 'secondary' : 'primary'}
              size={TypographySize.SMALL}
              weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
            >
              {renderTextWithQueryMatch(subject, matchInfo)}
            </Typography>
          )}
          <MessageChips>
            {message && (
              <Typography color='secondary' size={TypographySize.CAPTION}>
                {renderTextWithQueryMatch(
                  matchInfo ? excerptNormalizedQueryMatch(message, matchInfo) : message,
                  matchInfo
                )}
              </Typography>
            )}
            {renderUserLabelChips()}
            {renderScheduledSendLink(emails, systemLabels, true)}
          </MessageChips>
        </Text>
      </CompactMessageCellContainer>
    </div>
  );
};
