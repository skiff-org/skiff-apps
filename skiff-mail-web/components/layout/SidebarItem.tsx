import { isString } from 'lodash';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Icon,
  Icons,
  IconButton,
  IconText,
  Tooltip,
  Typography,
  TooltipLabelProps,
  CustomCircularProgress
} from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';
import { useTheme } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { useGetNumUnreadQuery } from 'skiff-mail-graphql';
import { POLL_INTERVAL_IN_MS } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { DNDItemTypes, MessageCellDragObject } from '../../utils/dragAndDrop';
import { FILES_LABEL, isFolder, Label, LabelType, RESTRICTED_DRAG_AND_DROP_LABELS, UserLabel } from '../../utils/label';
import LabelOptionsDropdown from '../labels/LabelOptionsDropdown';

const SidebarLabel = styled.div<{
  $active: boolean;
  $isOver: boolean;
  $primaryAction?: boolean;
  $isDarkMode?: boolean;
}>`
  padding: 4px 4px 4px 8px;
  gap: 8px;
  height: 28px;
  border-radius: 8px;
  box-sizing: border-box;
  box-sizing: border-box;
  align-items: center;
  display: flex;
  position: relative;
  justify-content: space-between;

  ${(props) =>
    !props.$primaryAction &&
    css`
      background-color: ${props.$active
        ? 'var(--bg-cell-active)'
        : props.$isOver
        ? 'var(--bg-cell-hover)'
        : 'transparent'};
      border: ${props.$isOver ? '1px solid var(--border-active)' : '1px solid transparent'};
      &:hover {
        background-color: ${props.$active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)'};
        cursor: pointer;
      }
    `}
  ${(props) =>
    props.$primaryAction &&
    css`
      background-color: ${props.$isDarkMode ? 'var(--border-primary)' : 'var(--bg-l2-solid)'};
      box-shadow: ${props.$isDarkMode
        ? '1px 2px 0 rgb(255 255 255 / 7%), inset 1px 1px 0 rgb(255 255 255 / 7%)'
        : 'var(--shadow-l1)'};
      &:hover {
        box-shadow: var(--shadow-l2);
        cursor: pointer;
      }
    `}
`;

const SidebarItemLink = styled.a`
  text-decoration: none;
`;

const MoreOptionsWrapper = styled.div`
  margin-left: auto;
`;

const IconTextContainer = styled.div`
  max-width: 172px;
  user-select: none;
`;

const UnreadLabel = styled(Typography)`
  padding-right: 4px;
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

export enum LabelVariants {
  System = 1,
  User = 2,
  Folder = 3,
  More = 4
}

const LabelSidebarItem: React.FC<{ label: Label; variant: LabelVariants }> = ({ label, variant }) => {
  const routeLabel = useCurrentLabel();
  const router = useRouter();
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
    variables: { label: label.value },
    skip: label.value === SystemLabels.Sent || label.value === SystemLabels.Drafts || label.value === FILES_LABEL.value,
    pollInterval: POLL_INTERVAL_IN_MS
  });

  const numUnreadInbox = data?.unread ?? 0;

  // Files label does not populate route label like other system labels (since it's handled by pages/files.tsx)
  const filesLabelActive = label.value === FILES_LABEL.value && router.pathname.includes('/files');

  const active =
    (isString(routeLabel) && encodeURIComponent(routeLabel.toLowerCase()) === encodedLabelName) || filesLabelActive;

  const handleDrop = (item: MessageCellDragObject) => {
    return label.type === LabelType.SYSTEM || isFolder(label)
      ? moveThreads(item.threadIDs, label, [item.currRouteLabel])
      : applyUserLabel(item.threadIDs, [label]);
  };

  const [{ isOver }, drop] = useDrop(() => ({
    accept: DNDItemTypes.MESSAGE_CELL,
    drop: handleDrop,
    collect: (monitor) => ({
      isOver: !!monitor.isOver()
    }),
    canDrop: () => !RESTRICTED_DRAG_AND_DROP_LABELS.has(label.value as SystemLabels)
  }));

  const labelIcon =
    label.type === LabelType.SYSTEM ? (
      label.icon
    ) : (
      <Icons color={label.color} icon={isFolder(label) ? Icon.Folder : Icon.Tag} />
    );
  const href = `${label.type === LabelType.SYSTEM ? '/' : '/label#'}${encodedLabelName}`;
  const dispatch = useDispatch();
  return (
    <div ref={drop}>
      <Link href={href} passHref>
        <SidebarLabel
          $active={active}
          $isOver={canDrop(routeLabel, label.value) && isOver}
          onClick={() => {
            // we don't use the usual useThreadActions hook to close the active thread
            // because it would update the url and pollute the history stack on mailbox change
            dispatch(
              skemailMailboxReducer.actions.setActiveThread({ activeThreadID: undefined, activeEmailID: undefined })
            );
          }}
          onMouseLeave={() => setHover(false)}
          onMouseOver={() => setHover(true)}
        >
          <IconTextContainer>
            <IconText
              color={active || hover ? 'primary' : 'secondary'}
              label={label.name}
              startIcon={labelIcon}
              type='paragraph'
            />
          </IconTextContainer>
          {variant !== LabelVariants.System && (hover || showDropdown) && (
            <MoreOptionsWrapper>
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
            </MoreOptionsWrapper>
          )}
          {numUnreadInbox > 0 && (
            <UnreadLabel color={active || hover ? 'primary' : 'secondary'} level={3}>
              {numUnreadInbox.toLocaleString()}
            </UnreadLabel>
          )}
        </SidebarLabel>
      </Link>
      {variant !== LabelVariants.System && (
        <LabelOptionsDropdown
          buttonRef={ref}
          label={label as UserLabel}
          setShowDropdown={setShowDropdown}
          showDropdown={showDropdown}
        />
      )}
    </div>
  );
};

interface ActionSidebarItemProps {
  spinner?: boolean;
  progress?: number;
  dataTest?: string;
  tooltip?: TooltipLabelProps | string;
  label: string;
  icon: Icon;
  color?: 'primary' | 'secondary';
  href?: string;
  // whether button should stand out as white
  primaryAction?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const ActionSidebarItem: React.FC<ActionSidebarItemProps> = ({
  dataTest,
  progress,
  label,
  icon,
  color = 'primary',
  href,
  onClick,
  tooltip,
  spinner,
  primaryAction
}) => {
  const { theme } = useTheme();
  const renderSidebarLabel = () => (
    <SidebarLabel
      $active={false}
      $isDarkMode={theme === 'dark'}
      $isOver={false}
      $primaryAction={primaryAction}
      data-test={dataTest}
      onClick={onClick}
    >
      <IconText color={color} label={label} startIcon={icon} type='paragraph' />
      {(spinner || progress !== undefined) && <CustomCircularProgress progress={progress} spinner={spinner} />}
    </SidebarLabel>
  );

  const withTooltip = () =>
    tooltip ? <Tooltip label={tooltip}>{renderSidebarLabel()}</Tooltip> : renderSidebarLabel();

  return !!href ? (
    <SidebarItemLink href={href} target='_blank'>
      {withTooltip()}
    </SidebarItemLink>
  ) : (
    withTooltip()
  );
};

export { LabelSidebarItem, ActionSidebarItem };
