import { Avatar, Chip, Divider, Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { BrowserView, isMobile, MobileView } from 'react-device-detect';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import { useResizeDetector } from 'react-resize-detector';
import styled, { css } from 'styled-components';

import { MOBILE_ITEM_HEIGHT } from '../../../constants/mailbox.constants';
import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../../models/thread';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { UserLabel } from '../../../utils/label';
import Checkbox from '../../Checkbox';
import { MessageCellActions } from './MessageCellActions';

const ActionsContainer = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  height: 20px;
`;

const EmailInfo = styled.div`
  display: flex;
  order: 3;
  margin-left: auto;
  justify-content: flex-end;
  gap: 16px;

  ${isMobile
    ? `
      grid-column: 3;
      grid-row: 1;
    `
    : ''}
`;

const getBorderRadius = (
  active: boolean,
  selected: boolean,
  isThreadAboveSelected: boolean,
  isThreadBelowSelected: boolean
) =>
  css`
    border-bottom-left-radius: ${isThreadBelowSelected && (!active || selected) ? '0px' : '8px'};
    border-bottom-right-radius: ${isThreadBelowSelected && (!active || selected) ? '0px' : '8px'};
    border-top-left-radius: ${isThreadAboveSelected && (!active || selected) ? '0px' : '8px'};
    border-top-right-radius: ${isThreadAboveSelected && (!active || selected) ? '0px' : '8px'};
  `;

const MessageCellContainer = styled.div<{
  active: boolean;
  selected: boolean;
  isThreadAboveSelected: boolean;
  isThreadBelowSelected: boolean;
}>`
  display: flex;
  align-items: center;
  padding: 12px 16px 12px 12px;
  flex-wrap: nowrap;
  ${(props) =>
    props.selected &&
    css`
      background-color: var(--bg-cell-hover);
    `}
  ${(props) =>
    props.active &&
    css`
      background-color: var(--bg-cell-active);
    `}
  ${(props) =>
    !props.active &&
    !props.selected &&
    css`
      background-color: transparent;
    `}
  ${(props) => getBorderRadius(props.active, props.selected, props.isThreadAboveSelected, props.isThreadBelowSelected)}
  gap: 8px;
  & ${ActionsContainer} {
    display: none;
  }
  & ${EmailInfo} {
    display: inherit;
  }
  &:hover {
    background-color: ${(props) => (props.active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)')};
    cursor: pointer;
    border-bottom-left-radius: ${(props) => (props.isThreadBelowSelected && props.selected ? '0px' : '8px')};
    border-bottom-right-radius: ${(props) => (props.isThreadBelowSelected && props.selected ? '0px' : '8px')};
    border-top-left-radius: ${(props) => (props.isThreadAboveSelected && props.selected ? '0px' : '8px')};
    border-top-right-radius: ${(props) => (props.isThreadAboveSelected && props.selected ? '0px' : '8px')};
    & ${ActionsContainer} {
      display: inherit;
    }
    & ${EmailInfo} {
      display: none;
    }
  }

  ${isMobile
    ? `
        display: grid;
        grid-template-columns: 16px;
      `
    : ''}
`;

const EmailContent = styled.div`
  display: flex;
  gap: 8px;
  flex: 1;
  margin: -2px 0px;
  min-width: 0px;
  margin-right: 16px;
  align-items: center;
  overflow: hidden;

  ${isMobile
    ? `
        grid-column: 2 / 4;
        margin: 0;
        grid-row: 2;
        display: grid;
      `
    : ''}
`;

const LabelsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  ${isMobile
    ? `
      grid-column: 1;
      grid-row: 3;
    `
    : ''}
`;

const AvatarContainer = styled.div`
  height: fit-content;
  width: fit-content;
`;

const UnreadIndicator = styled.div<{ isMobile?: boolean }>`
  width: ${(props) => (props.isMobile ? '8px' : '6px')};
  height: ${(props) => (props.isMobile ? '8px' : '6px')};
  background: var(--icon-link);
  border-radius: 24px;
`;

const EmailSender = styled.div<{ stacked: boolean }>`
  width: 184px;
  margin: 0 8px;
  display: flex;

  ${isMobile
    ? `
      grid-column: 2;
      margin: 0 0px;
    `
    : ''}
`;

const EmailSubject = styled(Typography)`
  flex-shrink: 0;

  ${isMobile
    ? `
      grid-column: 1;
      grid-row: 1;
    `
    : ''}
`;

const EmailMessage = styled(Typography)`
  ${isMobile
    ? `
      grid-column: 1;
      grid-row: 2;
    `
    : `margin-left: 4px;`}
`;

const MobileMessageCellContainer = styled.div<{ active: boolean }>`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
  background-color: ${(props) => (props.active ? 'var(--bg-cell-active)' : 'transparent')};
  border-radius: 8px;
  gap: 3px;
  & ${ActionsContainer} {
    display: none;
  }
  & ${EmailInfo} {
    display: inherit;
  }
  &:hover {
    background-color: ${(props) => (props.active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)')};
    cursor: pointer;
    & ${ActionsContainer} {
      display: inherit;
    }
    & ${EmailInfo} {
      display: none;
    }
  }
  display: grid;
  grid-template-columns: 16px;
`;

const MobileCheckBoxWrapper = styled.div`
  display: flex;
  flex-direction: row;
  padding: 12px 16px 12px 0px;
  gap: 8px;
  border-bottom: 1px solid var(--border-secondary);
`;

const Senders = styled(Typography)`
  width: 172px;
`;

const NumEmailsInThread = styled(Typography)`
  margin-left: 4px;
`;

const EmailSubjectAndBody = styled.div<{ isMobile: boolean }>`
  display: flex;
  overflow: hidden;
  flex-direction: ${(props) => (props.isMobile ? 'column' : 'row')};
`;

const EMAIL_LAYOUT_BREAKPOINT = 600;
interface MessageCellProps {
  // content
  thread: MailboxThreadInfo;
  read: boolean;
  displayNames: string[];
  userLabels: Array<UserLabel> | null | undefined;
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  date: Date;
  label: string;
  // interaction
  active: boolean;
  selected: boolean;
  onSelectToggle: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  // row styling
  isThreadAboveSelected: boolean;
  isThreadBelowSelected: boolean;
  isThreadBelowActive: boolean;
}

export const MessageCell = ({
  read,
  displayNames,
  userLabels,
  subject,
  message,
  hasAttachment,
  date,
  label,
  selected,
  active,
  thread,
  onSelectToggle,
  onClick,
  isThreadAboveSelected,
  isThreadBelowSelected,
  isThreadBelowActive
}: MessageCellProps) => {
  const { width, ref } = useResizeDetector();
  const [hover, setHover] = useState(false);

  const { threadID, emails } = thread;

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);
  const { value: currRouteLabel } = useRouterLabelContext();

  const [_, drag, preview] = useDrag({
    // Also keep track of the current route label to use the most up to date route label when dragging
    item: { threadIDs: selectedThreadIDs.length ? selectedThreadIDs : [threadID], currRouteLabel },
    type: DNDItemTypes.MESSAGE_CELL,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  });

  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const onHover = useCallback(() => {
    setHover(true);
  }, []);

  const offHover = useCallback(() => {
    setHover(false);
  }, []);

  // If the given string is a display name, return the first name in the display name.
  // i.e name = "Display Name" will return "Display"
  // If the given string is an email address, return the entire email address.
  const getFirstNameOrEmail = (name: string) => {
    if (!name.length) return '';
    return name.split(' ')[0];
  };

  const getSenders = () => {
    if (!displayNames.length) return '';
    if (displayNames.length === 1) {
      return displayNames[0];
    }
    if (displayNames.length === 2) {
      return `${getFirstNameOrEmail(displayNames[0])}, ${getFirstNameOrEmail(displayNames[1])}`;
    }
    // More than three senders in the thread
    return `${displayNames[0].split(' ')[0]} ... ${displayNames[displayNames.length - 1].split(' ')[0]}`;
  };

  const getTextColor = () => {
    if (active) {
      return 'primary';
    }
    if (read) {
      return 'secondary';
    }
    return 'primary';
  };
  const textColor = getTextColor();

  const messageCellContent = (
    <>
      <BrowserView>
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation();
            onSelectToggle(e);
          }}
        />
      </BrowserView>
      <UnreadIndicator isMobile={isMobile} style={{ opacity: read ? 0 : 1.0 }} />
      {!isMobile && !!displayNames.length && (
        <AvatarContainer style={{ opacity: read ? 0.4 : 1.0 }}>
          <Avatar label={displayNames[0]} size='small' />
        </AvatarContainer>
      )}
      <EmailSender stacked={(width ?? 0) < EMAIL_LAYOUT_BREAKPOINT}>
        <Senders color={textColor} level={isMobile ? 1 : 2} type={read ? 'paragraph' : 'label'}>
          {getSenders()}
        </Senders>
        {emails.length > 1 && (
          <NumEmailsInThread color='secondary' type='paragraph' wrap>
            {emails.length}
          </NumEmailsInThread>
        )}
      </EmailSender>
      <EmailContent>
        <LabelsContainer>
          {userLabels?.map((userLabel) => (
            <Chip
              key={userLabel.value}
              label={userLabel.name}
              size='small'
              startIcon={<Icons color={userLabel.color} icon={Icon.Dot} />}
              type='tag'
            />
          ))}
        </LabelsContainer>
        <EmailSubjectAndBody isMobile={isMobile}>
          {subject && (
            <EmailSubject color={textColor} level={isMobile ? 1 : 2} type={read ? 'paragraph' : 'label'}>
              {subject}
            </EmailSubject>
          )}
          {message && (
            <EmailMessage color='secondary' level={isMobile ? 1 : 2} type='paragraph'>
              {!isMobile ? '– ' : ''}
              {message}
            </EmailMessage>
          )}
        </EmailSubjectAndBody>
      </EmailContent>
      {!isMobile && (
        <ActionsContainer active={active}>
          <MessageCellActions label={label} read={read} thread={thread} />
        </ActionsContainer>
      )}
      <EmailInfo>
        {hasAttachment && <Icons dataTest='message-cell-attachment-icon' icon={Icon.Attachment} />}
        <Typography color='secondary' level={3} type='paragraph'>
          {dayjs(date).format('MMM D')}
        </Typography>
      </EmailInfo>
    </>
  );

  const showBottomDivider = !selected && !active && !hover && !isThreadBelowSelected && !isThreadBelowActive;
  return (
    <>
      <div onMouseLeave={offHover} onMouseOver={onHover} ref={drag} style={{ height: MOBILE_ITEM_HEIGHT }}>
        {/* trick to hide top border without extra state  */}
        {hover && <Divider color='inverse' style={{ marginBottom: '-1px' }} />}
        <MobileView>
          <MobileCheckBoxWrapper>
            {mobileMultiItemsActive && (
              <Checkbox
                checked={selected}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectToggle(e);
                }}
                size='large'
              />
            )}
            <MobileMessageCellContainer active={active} onClick={onClick} ref={ref}>
              {messageCellContent}
            </MobileMessageCellContainer>
          </MobileCheckBoxWrapper>
        </MobileView>
        <BrowserView>
          <MessageCellContainer
            active={active}
            isThreadAboveSelected={isThreadAboveSelected}
            isThreadBelowSelected={isThreadBelowSelected}
            onClick={onClick}
            ref={ref}
            selected={selected}
          >
            {messageCellContent}
          </MessageCellContainer>
        </BrowserView>
        {/* hide dividers if there's any surrounding selection state */}
        {showBottomDivider && <Divider />}
      </div>
    </>
  );
};
