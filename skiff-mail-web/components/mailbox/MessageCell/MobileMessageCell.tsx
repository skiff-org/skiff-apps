import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { Icon, Typography, Icons } from 'nightwatch-ui';
import { Chip, Facepile } from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { useTheme } from 'skiff-front-utils';
import { useLongTouch } from 'skiff-front-utils';
import { sendRNWebviewMsg } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { MOBILE_ITEM_HEIGHT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useDate } from '../../../hooks/useDate';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { LABEL_TO_SYSTEM_LABEL, UserLabel } from '../../../utils/label';
import Checkbox from '../../Checkbox';

import { COMPLETE_ACTION_THRESHOLD, LONG_TOUCH_DURATION, SWIPE_TRANSITION_DURATION } from './constants';
import {
  AnimatedCheckbox,
  EmailMessage,
  EmailSubject,
  IconWrapper,
  LargeIconTextContainer,
  MobileCheckBoxWrapper,
  MobileMessageCellContainer,
  MobileReadUnreadBox,
  MobileTrashBox,
  Senders,
  UnreadIndicator,
  MobilePreviewWrapper,
  MobilePreviewRow,
  MobileRightActions,
  NumThreadBadge,
  PaperClip,
  LabelsContainer
} from './MessageCell.styles';
import { MessageCellAvatar } from './MessageCellAvatar';
import { Swipeable } from './Swipeable';
import { getSenders, waitFor } from './utils';

dayjs.extend(isToday);

enum SwipeStatus {
  NotSwiping,
  Left,
  Right
}

export interface MobileMessageCellProps {
  threadID: string;
  read: boolean;
  addresses: string[];
  displayNames: string[];
  facepileNames: string[];
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  date: Date;
  label: string;
  // interaction
  active: boolean;
  selected?: boolean;
  numEmails?: number;
  userLabels?: Array<UserLabel> | null | undefined;
  onSelectToggle: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  markAsReadUnreadClick?: () => void;
}

export const MobileMessageCell = ({
  threadID,
  read,
  addresses,
  displayNames,
  facepileNames,
  subject,
  message,
  hasAttachment,
  date,
  label,
  selected = false,
  active,
  numEmails,
  userLabels,
  onSelectToggle,
  onClick,
  markAsReadUnreadClick
}: MobileMessageCellProps) => {
  const { ref } = useResizeDetector();
  const dispatch = useDispatch();
  const multiSelectOpen = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const multiSelectOpenRef = useRef(multiSelectOpen);
  const [swipeStatus, setSwipeStatus] = useState(SwipeStatus.NotSwiping);
  const { theme } = useTheme();
  const { getMonthAndDay, getTime } = useDate();

  // Thread actions with Ignore Active set to true, so that component will not get updated on route change
  // or when active thread is changed
  const { archiveThreads, trashThreads, moveThreads } = useThreadActions(true);

  const onLongTouch = () => {
    // Get mult select open from ref because onLongTouch is used in an event listener
    // and it does not get updated
    const multiSelectOpenState = multiSelectOpenRef.current;
    if (multiSelectOpenState) return;
    sendRNWebviewMsg('triggerHapticFeedback', { hapticType: 'selection' });
    dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(true)); // open drawer
    dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [threadID] })); // select thread
  };

  // On long press on message cell
  useLongTouch(ref, onLongTouch, LONG_TOUCH_DURATION);

  useEffect(() => {
    // Update multiSelectOpen ref
    multiSelectOpenRef.current = multiSelectOpen;
  }, [multiSelectOpen]);

  const getFacepileColor = (isDarkMode: boolean) => {
    if (active) {
      return isDarkMode ? '#282828' : '#f0f0f0';
    }
    if (!read) {
      return isDarkMode ? '#242424' : '#ffffff';
    }
    return isDarkMode ? '#1f1f1f' : 'var(--bg-l1-solid)';
  };
  const facepileColor = getFacepileColor(theme === 'dark');

  const getCellDate = () => (dayjs(date).isToday() ? getTime(date) : `${getTime(date)}, ${getMonthAndDay(date)}`);
  const senders = getSenders(displayNames);

  const messageCellContent = (
    <>
      <Facepile background={facepileColor} isMobile>
        {facepileNames.map((senderName, index) => {
          return (
            <MessageCellAvatar
              address={addresses[index]}
              key={`${addresses[index]}-${threadID}`}
              numAvatars={facepileNames.length}
              senderName={senderName}
            />
          );
        })}
      </Facepile>
      <MobilePreviewWrapper>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          <Senders color={read ? 'secondary' : 'primary'} level={1} type={read ? 'paragraph' : 'label'}>
            {senders}
          </Senders>
          <MobileRightActions>
            <UnreadIndicator $cellTransition={multiSelectOpen} $read={read} />
            {hasAttachment && (
              <PaperClip>
                <Icons color='secondary' dataTest='message-cell-attachment-icon' icon={Icon.PaperClip} size='xsmall' />
              </PaperClip>
            )}
            <Typography color='secondary' dataTest='message-cell-date' level={4}>
              {getCellDate()}
            </Typography>
          </MobileRightActions>
        </MobilePreviewRow>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          {subject && (
            <EmailSubject color={read ? 'secondary' : 'primary'} level={2} type={read ? 'paragraph' : 'label'}>
              {subject}
            </EmailSubject>
          )}
        </MobilePreviewRow>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          <Typography color='secondary' level={4}>
            {message && (
              <EmailMessage color='secondary' level={2}>
                {message}
              </EmailMessage>
            )}
          </Typography>
          <LabelsContainer>
            {userLabels?.map((userLabel) => (
              <Chip
                key={userLabel.value}
                label={userLabels.length < 3 ? userLabel.name : undefined}
                size='small'
                startIcon={<Icons color={userLabel.color} icon={Icon.Dot} />}
              />
            ))}
          </LabelsContainer>
          {numEmails && numEmails > 1 && (
            <NumThreadBadge>
              <Typography level={4} type='label'>
                {numEmails}
              </Typography>
            </NumThreadBadge>
          )}
        </MobilePreviewRow>
      </MobilePreviewWrapper>
    </>
  );

  const canUndo = ([SystemLabels.Trash, SystemLabels.Archive] as string[]).includes(label);
  const leftComponent = (
    <MobileReadUnreadBox>
      {swipeStatus === SwipeStatus.Left && (
        <LargeIconTextContainer>
          <IconWrapper>
            <Icons color='white' icon={read ? Icon.EnvelopeUnread : Icon.EnvelopeRead} size='large' />
          </IconWrapper>
        </LargeIconTextContainer>
      )}
    </MobileReadUnreadBox>
  );

  const rightComponent = (
    <MobileTrashBox isUndoTrash={canUndo}>
      {swipeStatus === SwipeStatus.Right && (
        <LargeIconTextContainer>
          <IconWrapper>
            <Icons color={canUndo ? 'yellow' : 'white'} icon={canUndo ? Icon.MoveMailbox : Icon.Archive} size='large' />
          </IconWrapper>
        </LargeIconTextContainer>
      )}
    </MobileTrashBox>
  );

  const onSwipeCompleteCb = async (progress: number) => {
    if (progress > 0) {
      // When swipe to the right end
      if (markAsReadUnreadClick) {
        void markAsReadUnreadClick();
      }
    } else {
      // When swipe to the left end
      await waitFor(SWIPE_TRANSITION_DURATION);
      const isDraft = label === SystemLabels.Drafts;
      if (label === SystemLabels.Archive || label === SystemLabels.Trash) {
        void moveThreads([threadID], LABEL_TO_SYSTEM_LABEL[SystemLabels.Inbox], [label]);
      } else if (isDraft) {
        // if draft, send to trash
        void trashThreads([threadID], true);
      } else {
        void archiveThreads([threadID]);
      }
    }
    setSwipeStatus(SwipeStatus.NotSwiping);
  };

  const onSwipePassThresholdCb = () => {
    sendRNWebviewMsg('triggerHapticFeedback', {});
  };

  return (
    <Swipeable
      completeThreshold={COMPLETE_ACTION_THRESHOLD}
      disableSwipe={multiSelectOpen}
      leftComponent={leftComponent}
      onSwipe={(e) => setSwipeStatus(e < 0 ? SwipeStatus.Right : SwipeStatus.Left)}
      onSwipeComplete={(progress) => void onSwipeCompleteCb(progress)}
      onSwipePassThreshold={onSwipePassThresholdCb}
      rightComponent={rightComponent}
      style={{ height: MOBILE_ITEM_HEIGHT, overflow: 'hidden' }}
    >
      <MobileCheckBoxWrapper className='hasTransition' isDarkMode={theme === 'dark'} read={read}>
        {
          <AnimatedCheckbox show={multiSelectOpen}>
            <Checkbox
              checked={selected}
              onClick={(e) => {
                e.stopPropagation();
                onSelectToggle(e);
                sendRNWebviewMsg('triggerHapticFeedback', { hapticType: 'selection' });
              }}
              size='large'
            />
          </AnimatedCheckbox>
        }
        <MobileMessageCellContainer
          data-test='message-cell'
          isDarkMode={theme === 'dark'}
          multiSelectOpen={multiSelectOpen}
          onClick={onClick}
          read={read}
          ref={ref}
        >
          {messageCellContent}
        </MobileMessageCellContainer>
      </MobileCheckBoxWrapper>
    </Swipeable>
  );
};
