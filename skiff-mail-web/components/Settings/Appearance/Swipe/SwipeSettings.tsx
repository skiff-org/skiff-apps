import { Divider, Icon } from '@skiff-org/skiff-ui';
import React from 'react';
import { TitleActionSection, useUserPreference } from 'skiff-front-utils';
import { SwipeSetting } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

export const getSwipeIcon = (gesture: SwipeSetting, read: boolean) => {
  if (!gesture) {
    console.error('No swipe gesture for icon');
    return Icon.QuestionCircle;
  }
  switch (gesture) {
    case SwipeSetting.Archive:
      return Icon.Archive;
    case SwipeSetting.Delete:
      return Icon.Trash;
    case SwipeSetting.Unread:
      return read ? Icon.EnvelopeUnread : Icon.EnvelopeRead;
    default:
      return Icon.EnvelopeUnread;
  }
};

export const getSwipeIconColor = (gesture: SwipeSetting) => {
  if (!gesture) {
    console.error('No swipe gesture for icon color');
    return 'white';
  }
  switch (gesture) {
    case SwipeSetting.Archive:
      return 'yellow';
    case SwipeSetting.Delete:
      return 'white';
    case SwipeSetting.Unread:
      return 'white';
    default:
      return 'white';
  }
};

export const getSwipeBgColor = (gesture: SwipeSetting) => {
  if (!gesture) {
    console.error('No swipe gesture for bg color');
    return 'var(--accent-red-primary)';
  }
  switch (gesture) {
    case SwipeSetting.Archive:
      return 'var(--accent-yellow-secondary)';
    case SwipeSetting.Delete:
      return 'var(--accent-red-primary)';
    case SwipeSetting.Unread:
      return 'var(--accent-blue-primary)';
    default:
      return 'var(--accent-blue-primary)';
  }
};

const SWIPE_SETTING_OPTIONS = [
  {
    label: 'Archive',
    value: SwipeSetting.Archive
  },
  {
    label: 'Delete',
    value: SwipeSetting.Delete
  },
  {
    label: 'Mark as unread',
    value: SwipeSetting.Unread
  }
];

/**
 * Component for changing the mailbox view format.
 */
export const SwipeSettings: React.FC = () => {
  const [leftSwipeAction, setLeftSwipeAction] = useUserPreference(StorageTypes.LEFT_SWIPE_GESTURE);
  const [rightSwipeAction, setRightSwipeAction] = useUserPreference(StorageTypes.RIGHT_SWIPE_GESTURE);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onChange: (value) => setLeftSwipeAction(value as SwipeSetting),
            value: leftSwipeAction,
            type: 'select',
            items: SWIPE_SETTING_OPTIONS
          }
        ]}
        title='Left swipe gesture'
      />
      <Divider />
      <TitleActionSection
        actions={[
          {
            onChange: (value) => setRightSwipeAction(value as SwipeSetting),
            value: rightSwipeAction,
            type: 'select',
            items: SWIPE_SETTING_OPTIONS
          }
        ]}
        title='Right swipe gesture'
      />
    </>
  );
};
