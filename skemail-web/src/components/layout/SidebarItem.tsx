import isString from 'lodash/isString';
import {
  ACCENT_COLOR_VALUES,
  CircularProgress,
  Icon,
  Icons,
  IconText,
  IconTextProps,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { IconTextWithEndActions, useTheme, WalletAliasWithName } from 'skiff-front-utils';
import { SystemLabels, UserLabelVariant } from 'skiff-graphql';
import styled, { css } from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { useDrafts } from '../../hooks/useDrafts';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { DNDItemTypes, MessageCellDragObject } from '../../utils/dragAndDrop';
import {
  FILES_LABEL,
  getLabelDisplayName,
  getURLFromLabel,
  HiddenLabel,
  HiddenLabels,
  isAliasLabel,
  isFolder,
  isImportLabel,
  isPlainLabel,
  isQuickAliasLabel,
  isSystemLabel,
  Label,
  LabelType,
  RESTRICTED_DRAG_AND_DROP_LABELS,
  UserLabelPlain
} from '../../utils/label';
import LabelOptionsDropdown from '../labels/LabelOptionsDropdown';

export const UserLabelIconColorContainer = styled.div<{ $color: string }>`
  background: ${(props) => props.$color};
  width: 16px;
  min-width: 16px;
  height: 16px;
  min-height: 16px;

  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SidebarLabel = styled.div<{
  $active: boolean;
  $isOver: boolean;
  $primaryAction?: boolean;
  $isDarkMode?: boolean;
}>`
  padding: 6px 4px 6px 8px;
  margin: 0px 6px;
  gap: 8px;
  height: 32px;
  max-height: 32px;
  border-radius: 6px;
  box-sizing: border-box;
  align-items: center;
  display: flex;
  position: relative;
  justify-content: space-between;

  ${(props) =>
    !props.$primaryAction &&
    css`
      background: ${props.$active
        ? 'var(--bg-overlay-tertiary)'
        : props.$isOver
        ? 'var(--bg-overlay-tertiary)'
        : 'transparent'};
      border: ${props.$isOver ? '1px solid var(--border-active)' : '1px solid transparent'};
      &:hover {
        background: var(--bg-overlay-tertiary);
        cursor: pointer;
      }
    `}
  ${(props) =>
    props.$primaryAction &&
    css`
      background: var(--bg-l2-solid);
      box-shadow: var(--shadow-l1);
      &:hover {
        box-shadow: var(--shadow-l2);
        cursor: pointer;
      }
    `}
`;

const SidebarItemLink = styled.a`
  text-decoration: none;
`;

const UnreadLabel = styled.div`
  padding-right: 4px;
`;

const IconTextContainer = styled.div`
  flex: 1;
  min-width: 0;
`;

/* Rules to determine if something can be dropped in another mailbox */
const canDrop = (activeLabel: string | null | undefined, targetLabel: Label) => {
  if (!activeLabel || isAliasLabel(targetLabel)) return false;
  // Threads in Drafts can only be dragged into trash
  if (activeLabel === SystemLabels.Drafts) {
    return targetLabel.value === SystemLabels.Trash;
  }
  // Threads in Inbox/Spam can be moved to Inbox/Spam/Trash
  if (isSystemLabel(targetLabel)) {
    return !RESTRICTED_DRAG_AND_DROP_LABELS.has(targetLabel.value as SystemLabels);
  }
  // Always allow moving to labels and folders
  if (isPlainLabel(targetLabel) || isFolder(targetLabel)) {
    return true;
  }
  return false;
};

export enum LabelVariants {
  System = 1,
  User = 2,
  Folder = 3,
  More = 4,
  Alias = 5
}

interface LabelSidebarItemProps {
  label: Exclude<Label, HiddenLabel>;
  variant: LabelVariants;
  numUnread?: number;
  walletAliasesWithName?: WalletAliasWithName[];
}

const MAX_NUM_UNREAD = 500_000;

const LabelSidebarItem: React.FC<LabelSidebarItemProps> = ({
  label,
  variant,
  numUnread,
  walletAliasesWithName = []
}: LabelSidebarItemProps) => {
  const { label: routeLabel, userLabelVariant } = useCurrentLabel();

  const location = useLocation();
  const isSearch = location.pathname.includes(HiddenLabels.Search);
  const encodedLabelName = encodeURIComponent(
    label.type === LabelType.SYSTEM ? label.value.toLowerCase() : label.name.toLowerCase()
  );

  const ref = useRef<HTMLDivElement>(null);
  // Used for user label option dropdown
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  // hover over button
  const [hover, setHover] = useState(false);

  const { moveThreads, applyUserLabel } = useThreadActions();

  const { isImportInProgress } = useAppSelector((state) => state.import);

  const { draftThreads } = useDrafts();
  const numDrafts = draftThreads.length;

  // Files label does not populate route label like other system labels (since it's handled by pages/files.tsx)
  const filesLabelActive = label.value === FILES_LABEL.value && location.pathname.includes('/files');

  const isLabelFolder = isFolder(label);

  const isSystemLabelActive = label.type === LabelType.SYSTEM && location.pathname.includes(encodedLabelName);

  const active =
    isSystemLabelActive ||
    (isString(routeLabel) &&
      encodeURIComponent(routeLabel.toLowerCase()) === encodedLabelName &&
      isLabelFolder === (userLabelVariant === UserLabelVariant.Folder)) ||
    filesLabelActive;

  const handleDrop = (item: MessageCellDragObject) => {
    if (isAliasLabel(label)) return;
    if (isImportLabel(label)) return;
    if (isQuickAliasLabel(label)) return;
    return label.type === LabelType.SYSTEM || isLabelFolder
      ? moveThreads(item.threadIDs, label, [item.currRouteLabel])
      : applyUserLabel(item.threadIDs, [label]);
  };

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: DNDItemTypes.MESSAGE_CELL,
      drop: handleDrop,
      collect: (monitor) => ({
        isOver: !!monitor.isOver()
      }),
      canDrop: () => !RESTRICTED_DRAG_AND_DROP_LABELS.has(label.value as SystemLabels) && !isAliasLabel(label)
    }),
    [handleDrop, label]
  );

  const getLabelIcon = () => {
    if (label.type === LabelType.SYSTEM) {
      return <Icons icon={label.icon} />;
    }
    if (label.variant === UserLabelVariant.Alias) {
      return <Icons color={active ? 'primary' : 'secondary'} icon={Icon.At} />;
    }
    if (isLabelFolder) {
      return <Icons color={label.color} icon={Icon.FolderSolid} />;
    }
    return (
      <UserLabelIconColorContainer
        $color={
          label.color
            ? (ACCENT_COLOR_VALUES[label.color] as Array<string>)?.[1] || 'var(--bg-overlay-tertiary)'
            : 'var(--bg-overlay-tertiary)'
        }
      >
        <Icons color={label.color} icon={Icon.Dot} size={Size.X_SMALL} />
      </UserLabelIconColorContainer>
    );
  };

  const href = getURLFromLabel(label);
  const dispatch = useDispatch();

  const hasMoreOptions = variant !== LabelVariants.System && variant !== LabelVariants.Alias;

  const displayLabelName =
    variant === LabelVariants.Alias ? getLabelDisplayName(label.name, walletAliasesWithName) : label.name;

  const iconTextProps: IconTextProps = {
    color: active ? 'primary' : 'secondary',
    label: displayLabelName,
    startIcon: getLabelIcon(),
    weight: TypographyWeight.REGULAR
  };

  return (
    <div ref={drop}>
      <Link to={href}>
        <SidebarLabel
          $active={active}
          $isOver={(canDrop(routeLabel, label) || isSearch) && isOver}
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
            {hasMoreOptions && (
              <IconTextWithEndActions
                endActions={[
                  {
                    icon: Icon.OverflowH,
                    onClick: (e?: React.MouseEvent) => {
                      e?.stopPropagation();
                      e?.preventDefault();
                      setShowDropdown((prev) => !prev);
                    },
                    buttonRef: ref
                  }
                ]}
                showEndActions={hover || showDropdown}
                {...iconTextProps}
              />
            )}
            {!hasMoreOptions && <IconText {...iconTextProps} />}
          </IconTextContainer>
          {!!numUnread && numUnread > 0 && (
            <Typography color={active ? 'primary' : 'secondary'} size={TypographySize.SMALL}>
              <UnreadLabel>
                {numUnread > MAX_NUM_UNREAD ? `${MAX_NUM_UNREAD / 1000}k+` : numUnread.toLocaleString()}
              </UnreadLabel>
            </Typography>
          )}
          {label.value === SystemLabels.Imports && isImportInProgress && (
            <CircularProgress progressColor='disabled' size={Size.SMALL} spinner />
          )}
          {label.value === SystemLabels.Drafts && numDrafts > 0 && (
            <Typography color={active ? 'primary' : 'secondary'} size={TypographySize.SMALL}>
              <UnreadLabel>{numDrafts.toLocaleString()}</UnreadLabel>
            </Typography>
          )}
        </SidebarLabel>
      </Link>
      {hasMoreOptions && (
        <LabelOptionsDropdown
          buttonRef={ref}
          label={label as UserLabelPlain}
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
  spinner,
  primaryAction
}) => {
  const { theme } = useTheme();
  const renderSidebarLabel = () => (
    <SidebarLabel
      $active={false}
      $isDarkMode={theme === ThemeMode.DARK}
      $isOver={false}
      $primaryAction={primaryAction}
      data-test={dataTest}
      onClick={onClick}
    >
      <IconText color={color} label={label} startIcon={icon} weight={TypographyWeight.REGULAR} />
      {(spinner || progress !== undefined) && (
        <CircularProgress progress={progress} progressColor='disabled' spinner={spinner} />
      )}
    </SidebarLabel>
  );

  return !!href ? (
    <SidebarItemLink href={href} target='_blank'>
      {renderSidebarLabel()}
    </SidebarItemLink>
  ) : (
    renderSidebarLabel()
  );
};

export { LabelSidebarItem, ActionSidebarItem };
