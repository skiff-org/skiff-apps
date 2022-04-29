import { Icon, IconButton, Icons, IconText, Typography } from '@skiff-org/skiff-ui';
import { isString } from 'lodash';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import styled from 'styled-components';

import { POLL_INTERVAL_IN_MS } from '../../constants/mailbox.constants';
import { SystemLabels, useGetNumUnreadQuery } from '../../generated/graphql';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useThreadActions } from '../../hooks/useThreadActions';
import { DNDItemTypes, MessageCellDragObject } from '../../utils/dragAndDrop';
import { Label, LabelType, RESTRICTED_DRAG_AND_DROP_LABELS, UserLabel } from '../../utils/label';
import { getEditorBasePath } from '../../utils/linkToEditorUtils';
import LabelOptionsDropdown from '../labels/LabelOptionsDropdown';

const Badge = styled.div<{ active: boolean }>`
  width: 20px;
  height: 20px;
  background: ${(props) => (props.active ? 'transparent' : 'var(--accent-red-secondary)')};
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SidebarLabel = styled.div<{ active: boolean; isOver: boolean }>`
  padding: 8px;
  border-radius: 8px;
  height: 40px;
  box-sizing: border-box;
  align-items: center;
  display: flex;
  justify-content: space-between;
  background-color: ${(props) =>
    props.active ? 'var(--bg-cell-active)' : props.isOver ? 'var(--bg-cell-hover)' : 'transparent'};

  &:hover {
    background-color: ${(props) => (props.active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)')};
    cursor: pointer;
  }
`;

const SettingsLink = styled.a`
  text-decoration: none;
`;

/* Rules to determine if something can be dropped in another mailbox */
const canDrop = (activeLabel: string | null | undefined, targetLabel: string) => {
  if (!activeLabel) return false;
  // Threads in Drafts can only be dragged into trash
  if (activeLabel === SystemLabels.Drafts) {
    return targetLabel === SystemLabels.Trash;
  }
  // Threads in Inbox/Spam can be moved to Inbox/Spam/Trash
  else {
    return !RESTRICTED_DRAG_AND_DROP_LABELS.has(targetLabel as SystemLabels);
  }
};

const LabelSidebarItem: React.FC<{ label: Label; type: 'system' | 'user' }> = ({ label, type }) => {
  const routeLabel = useCurrentLabel();
  const encodedLabelName = encodeURIComponent(
    label.type === LabelType.SYSTEM ? label.value.toLowerCase() : label.name.toLowerCase()
  );
  const ref = useRef<HTMLDivElement>(null);
  // Used for user label option dropdown
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  // hover over button
  const [hover, setHover] = useState(false);

  const { moveThreads, applyUserLabel } = useThreadActions();

  const { data } = useGetNumUnreadQuery({
    variables: { label: SystemLabels.Inbox },
    pollInterval: POLL_INTERVAL_IN_MS
  });

  const numUnreadInbox = data?.unread ?? 0;
  const active = isString(routeLabel) && encodeURIComponent(routeLabel.toLowerCase()) === encodedLabelName;

  const handleDrop = (item: MessageCellDragObject) => {
    const isTrash = item.currRouteLabel === SystemLabels.Trash;
    const isDrafts = item.currRouteLabel === SystemLabels.Drafts;

    return label.type === LabelType.SYSTEM
      ? moveThreads(item.threadIDs, label, isDrafts, isTrash)
      : applyUserLabel(item.threadIDs, label);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DNDItemTypes.MESSAGE_CELL,
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
    canDrop: () => !RESTRICTED_DRAG_AND_DROP_LABELS.has(label.value as SystemLabels)
  }));

  const labelIcon = label.type === LabelType.SYSTEM ? label.icon : <Icons color={label.color} icon={Icon.Dot} />;
  const href = `${label.type === LabelType.SYSTEM ? '/' : '/label#'}${encodedLabelName}`;

  return (
    <div ref={drop}>
      <Link href={href} passHref>
        <SidebarLabel onMouseOver={()=> setHover(true)} onMouseLeave={() => setHover(false)} active={active} isOver={canDrop(routeLabel, label.value) && isOver}>
          <IconText label={`${label.name}`} startIcon={labelIcon} type='paragraph' />
          {type === 'user' && hover && (
            <IconButton
              icon={Icon.OverflowH}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowDropdown((prev) => !prev);
              }}
              ref={ref}
              size='small'
            />
          )}
          {label.value === SystemLabels.Inbox && numUnreadInbox > 0 && (
            <Badge active={active}>
              <Typography color={active ? 'primary' : 'destructive'} level={3} type='paragraph'>
                {numUnreadInbox}
              </Typography>
            </Badge>
          )}
        </SidebarLabel>
      </Link>
      {type === 'user' && showDropdown && (
        <LabelOptionsDropdown buttonRef={ref} label={label as UserLabel} setShowDropdown={setShowDropdown} />
      )}
    </div>
  );
};

const ComposeSidebarItem: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <SidebarLabel active={false} isOver={false} onClick={onClick}>
    <IconText label='Compose' startIcon={Icon.Compose} type='paragraph' />
  </SidebarLabel>
);

const SearchSidebarItem: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <SidebarLabel active={false} isOver={false} onClick={onClick}>
    <IconText label='Search' startIcon={Icon.Search} type='paragraph' />
  </SidebarLabel>
);

const SettingsSidebarItem = () => (
  <SettingsLink href={`${getEditorBasePath()}/settings/account`} target='_blank'>
    <SidebarLabel active={false} isOver={false}>
      <IconText label='Settings' startIcon={Icon.Settings} type='paragraph' />
    </SidebarLabel>
  </SettingsLink>
);

const FeedbackSidebarItem: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <SidebarLabel active={false} isOver={false} onClick={onClick}>
      <IconText
        color='secondary'
        label='Send feedback'
        startIcon={Icon.Lightbulb}
        type='paragraph'
      />
    </SidebarLabel>
);

export { LabelSidebarItem, SearchSidebarItem, SettingsSidebarItem, FeedbackSidebarItem, ComposeSidebarItem };
