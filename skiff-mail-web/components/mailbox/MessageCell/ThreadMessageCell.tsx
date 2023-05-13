import React, { useEffect, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';

import { useRouterLabelContext } from '../../../context/RouterLabelContext';
import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../../models/thread';
import { DNDItemTypes } from '../../../utils/dragAndDrop';
import { UserLabelPlain, UserLabelAlias } from '../../../utils/label';

import { MessageCell } from './MessageCell';

interface ThreadMessageCellProps {
  // content
  thread: MailboxThreadInfo;
  displayNames: string[];
  facepileNames: string[];
  addresses: string[];
  userLabels: Array<UserLabelPlain | UserLabelAlias> | null | undefined;
  subject: string | null | undefined;
  message: string | null | undefined;
  hasAttachment: boolean;
  label: string;
  // interaction
  active: boolean;
  selected: boolean;
  onSelectToggle: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
  onClick: (e: React.MouseEvent<Element | HTMLInputElement, globalThis.MouseEvent>) => void;
}

/**
 * Component for rendering a message cell for a thread. This is used in the Mailbox component.
 */
export const ThreadMessageCell: React.FC<ThreadMessageCellProps> = ({
  displayNames,
  addresses,
  facepileNames,
  userLabels,
  subject,
  message,
  hasAttachment,
  label,
  selected,
  active,
  thread,
  onSelectToggle,
  onClick
}) => {
  const { threadID } = thread;

  const multiSelectOpen = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const multiSelectOpenRef = useRef(multiSelectOpen);

  const selectedThreadIDs = useAppSelector((state) => state.mailbox.selectedThreadIDs);

  const { value: currRouteLabel } = useRouterLabelContext();

  const [_, drag, preview] = useDrag({
    // Also keep track of the current route label to use the most up to date route label when dragging
    item: { threadIDs: selectedThreadIDs.length ? selectedThreadIDs : [threadID], currRouteLabel },
    type: DNDItemTypes.MESSAGE_CELL
  });

  useEffect(() => {
    // Update multiSelectOpen ref
    multiSelectOpenRef.current = multiSelectOpen;
  }, [multiSelectOpen]);

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  return (
    <MessageCell
      active={active}
      addresses={addresses}
      displayNames={displayNames}
      dragRef={drag}
      facepileNames={facepileNames}
      hasAttachment={hasAttachment}
      label={label}
      message={message}
      multiSelectOpen={multiSelectOpen}
      onClick={onClick}
      onSelectToggle={onSelectToggle}
      selected={selected}
      subject={subject}
      thread={thread}
      userLabels={userLabels}
    />
  );
};
