import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import { Icon, Typography, Icons, Layout, Size, ThemeMode, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { Facepile } from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useResizeDetector } from 'react-resize-detector';
import { useTheme, useUserPreference } from 'skiff-front-utils';
import { useLongTouch } from 'skiff-front-utils';
import { sendRNWebviewMsg } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { SwipeSetting } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { MOBILE_ITEM_HEIGHT } from '../../../constants/mailbox.constants';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useDate } from '../../../hooks/useDate';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { LABEL_TO_SYSTEM_LABEL, UserLabelPlain, UserLabelAlias } from '../../../utils/label';
import Checkbox from '../../Checkbox';
import { LabelChip } from '../../labels/LabelChip';
import { getSwipeBgColor, getSwipeIcon, getSwipeIconColor } from '../../Settings/Appearance/Swipe/SwipeSettings';
import {
  DEFAULT_INBOX_LEFT_SWIPE,
  DEFAULT_INBOX_RIGHT_SWIPE
} from '../../Settings/Appearance/Swipe/SwipeSettings.constants';

import { COMPLETE_ACTION_THRESHOLD, LONG_TOUCH_DURATION, SWIPE_TRANSITION_DURATION } from './constants';
import {
  AnimatedCheckbox,
  IconWrapper,
  LargeIconTextContainer,
  MobileCheckBoxWrapper,
  MobileMessageCellContainer,
  MobileLeftSwipeBox,
  MobileRightSwipeBox,
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
import { getStackedFacepileSize, getSenders, waitFor } from './utils';

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
  userLabels?: Array<UserLabelPlain | UserLabelAlias> | null | undefined;
  onSelectToggle: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  markThreadsAsReadUnread?: () => void;
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
  markThreadsAsReadUnread
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
  const facepileColor = getFacepileColor(theme === ThemeMode.DARK);

  const getCellDate = () => (dayjs(date).isToday() ? getTime(date) : `${getTime(date)}, ${getMonthAndDay(date)}`);
  const senders = getSenders(displayNames);

  const [curLeftSwipeGestureStored] = useUserPreference(StorageTypes.LEFT_SWIPE_GESTURE);
  const [curRightSwipeGestureStored] = useUserPreference(StorageTypes.RIGHT_SWIPE_GESTURE);

  // always defined with defaults
  const curLeftSwipeGesture = curLeftSwipeGestureStored ?? DEFAULT_INBOX_LEFT_SWIPE;
  const curRightSwipeGesture = curRightSwipeGestureStored ?? DEFAULT_INBOX_RIGHT_SWIPE;

  const renderUserLabelChips = () => {
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
              size={Size.SMALL}
              userLabel={userLabel}
            />
          );
        })}
      </LabelsContainer>
    );
  };

  const messageCellContent = (
    <>
      <Facepile background={facepileColor} layout={Layout.STACKED} size={getStackedFacepileSize(facepileNames.length)}>
        {facepileNames.map((senderName, index) => (
          <MessageCellAvatar
            address={addresses[index]}
            key={`${addresses[index]}-${threadID}`}
            senderName={senderName}
          />
        ))}
      </Facepile>
      <MobilePreviewWrapper>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          <Typography
            color={read ? 'secondary' : 'primary'}
            size={TypographySize.LARGE}
            weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
          >
            {senders}
          </Typography>
          <MobileRightActions>
            <UnreadIndicator $cellTransition={multiSelectOpen} $read={read} />
            {hasAttachment && (
              <PaperClip>
                <Icons
                  color='secondary'
                  dataTest='message-cell-attachment-icon'
                  icon={Icon.PaperClip}
                  size={Size.X_SMALL}
                />
              </PaperClip>
            )}
            <Typography color='secondary' dataTest='message-cell-date' size={TypographySize.CAPTION}>
              {getCellDate()}
            </Typography>
          </MobileRightActions>
        </MobilePreviewRow>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          {subject && (
            <Typography
              color={read ? 'secondary' : 'primary'}
              weight={read ? TypographyWeight.REGULAR : TypographyWeight.MEDIUM}
            >
              {subject}
            </Typography>
          )}
        </MobilePreviewRow>
        <MobilePreviewRow multiSelectOpen={multiSelectOpen}>
          <Typography color='secondary' size={TypographySize.CAPTION}>
            {message && <Typography color='secondary'>{message}</Typography>}
          </Typography>
          {renderUserLabelChips()}
          {numEmails && numEmails > 1 && (
            <NumThreadBadge>
              <Typography size={TypographySize.CAPTION} weight={TypographyWeight.MEDIUM}>
                {numEmails}
              </Typography>
            </NumThreadBadge>
          )}
        </MobilePreviewRow>
      </MobilePreviewWrapper>
    </>
  );

  // determine appropriate colors and icons for swiping
  const isInboxLabel = label === SystemLabels.Inbox;
  const canUndo = ([SystemLabels.Trash, SystemLabels.Archive] as string[]).includes(label);
  const leftSwipeIcon = isInboxLabel
    ? getSwipeIcon(curLeftSwipeGesture, read)
    : canUndo
    ? Icon.MoveMailbox
    : Icon.Archive;

  const leftSwipeBgColor = isInboxLabel
    ? getSwipeBgColor(curLeftSwipeGesture)
    : canUndo
    ? 'var(--accent-yellow-secondary)'
    : 'var(--accent-red-primary)';
  const leftSwipeIconColor = isInboxLabel ? getSwipeIconColor(curLeftSwipeGesture) : canUndo ? 'yellow' : 'white';

  const rightSwipeIcon = isInboxLabel
    ? getSwipeIcon(curRightSwipeGesture, read)
    : read
    ? Icon.EnvelopeUnread
    : Icon.EnvelopeRead;
  const rightSwipeBgColor = isInboxLabel ? getSwipeBgColor(curRightSwipeGesture) : 'var(--accent-blue-primary)';
  const rightSwipeIconColor = isInboxLabel ? getSwipeIconColor(curRightSwipeGesture) : 'white';

  // left component has left swipe colors
  const leftComponent = (
    <MobileLeftSwipeBox $forceColor={rightSwipeBgColor}>
      {swipeStatus === SwipeStatus.Left && (
        <LargeIconTextContainer>
          <IconWrapper>
            <Icons color={rightSwipeIconColor} icon={rightSwipeIcon} size={Size.X_MEDIUM} />
          </IconWrapper>
        </LargeIconTextContainer>
      )}
    </MobileLeftSwipeBox>
  );

  // right component has left swipe colors
  const rightComponent = (
    <MobileRightSwipeBox $forceColor={leftSwipeBgColor}>
      {swipeStatus === SwipeStatus.Right && (
        <LargeIconTextContainer>
          <IconWrapper>
            <Icons color={leftSwipeIconColor} icon={leftSwipeIcon} size={Size.X_MEDIUM} />
          </IconWrapper>
        </LargeIconTextContainer>
      )}
    </MobileRightSwipeBox>
  );

  // changes how swipe behaves on completion/reset
  // for left swipe, it is archive or trash if not inbox OR if the left configuration is archive/trash
  const leftSwipeIsArchiveOrTrash =
    !isInboxLabel || [SwipeSetting.Archive, SwipeSetting.Delete].includes(curLeftSwipeGesture);
  // right swipe is archive or trash only if inbox and user setting is configured as such
  const rightSwipeIsArchiveOrTrash =
    isInboxLabel && [SwipeSetting.Archive, SwipeSetting.Delete].includes(curRightSwipeGesture);

  const performSwipeGesture = (swipeGestureSetting: SwipeSetting | undefined) => {
    if (!swipeGestureSetting) {
      console.error('No swipe gesture passed');
      return;
    }
    switch (swipeGestureSetting) {
      case SwipeSetting.Unread:
        markThreadsAsReadUnread?.();
        break;
      case SwipeSetting.Archive:
        void archiveThreads([threadID]);
        break;
      case SwipeSetting.Delete:
        // note - assuming not drafts given swipe gesture changes if in drafts
        void trashThreads([threadID], false);
        break;
    }
  };

  const onSwipeCompleteCb = async (progress: number) => {
    if (isInboxLabel) {
      // respect user swipe settings if in inbox
      if (progress > 0) {
        // right swipe
        performSwipeGesture(curRightSwipeGesture);
      } else {
        // left swipe
        performSwipeGesture(curLeftSwipeGesture);
      }
    } else {
      // in other inboxes, swipes are constrained (move out of inbox)
      if (progress > 0) {
        // When swipe to the right end
        markThreadsAsReadUnread?.();
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
      leftSwipeIsArchiveOrTrash={leftSwipeIsArchiveOrTrash}
      onSwipe={(e) => setSwipeStatus(e < 0 ? SwipeStatus.Right : SwipeStatus.Left)}
      onSwipeComplete={(progress) => void onSwipeCompleteCb(progress)}
      onSwipePassThreshold={onSwipePassThresholdCb}
      rightComponent={rightComponent}
      rightSwipeIsArchiveOrTrash={rightSwipeIsArchiveOrTrash}
      style={{ height: MOBILE_ITEM_HEIGHT, overflow: 'hidden' }}
    >
      <MobileCheckBoxWrapper className='hasTransition' isDarkMode={theme === ThemeMode.DARK} read={read}>
        {
          <AnimatedCheckbox show={multiSelectOpen}>
            <Checkbox
              checked={selected}
              onClick={(e) => {
                e.stopPropagation();
                onSelectToggle(e);
                sendRNWebviewMsg('triggerHapticFeedback', { hapticType: 'selection' });
              }}
              size={Size.LARGE}
            />
          </AnimatedCheckbox>
        }
        <MobileMessageCellContainer
          data-test='message-cell'
          isDarkMode={theme === ThemeMode.DARK}
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
