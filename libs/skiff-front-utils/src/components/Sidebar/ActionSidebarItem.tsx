import { IconText, ThemeMode, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import React from 'react';
import styled, { css } from 'styled-components';

import { useTheme } from '../../theme/AppThemeProvider';

import { ActionSidebarItemProps } from './Sidebar.types';

const SidebarLabel = styled.div<{
  $active: boolean;
  $isOver: boolean;
  $primaryAction?: boolean;
  $isCompact?: boolean;
  $isDarkMode?: boolean;
}>`
  padding: 6px 4px 6px 8px;
  gap: 8px;
  height: ${(props) => (props.$primaryAction ? 36 : 32)}px;
  border-radius: 6px;
  box-sizing: border-box;
  box-sizing: border-box;
  align-items: center;
  place-content: ${(props) => (props.$isCompact ? 'center !important' : '')};
  display: flex;
  position: relative;
  margin: 0 6px;
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
        background: ${props.$active ? 'var(--bg-cell-active)' : 'var(--bg-cell-hover)'};
        * {
          color: var(--text-primary) !important;
          fill: var(--icon-primary) !important;
        }
        cursor: pointer;
      }
    `}
  ${(props) =>
    props.$primaryAction &&
    css`
      background: var(--bg-l3-solid);
      box-shadow: ${props.$isDarkMode
        ? '1px 2px 0 rgb(255 255 255 / 7%), inset 1px 1px 0 rgb(255 255 255 / 7%)'
        : 'var(--shadow-l1)'};
      &:hover {
        box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.24);
        cursor: pointer;
      }
    `}
`;

const SidebarItemLink = styled.a`
  text-decoration: none;
`;

const ActionSidebarItem: React.FC<ActionSidebarItemProps> = ({
  dataTest,
  label,
  icon,
  color = 'primary',
  href,
  onClick,
  primaryAction,
  isMinimized,
  endLabel,
  className
}: ActionSidebarItemProps) => {
  const { theme } = useTheme();
  const renderSidebarLabel = () => (
    <SidebarLabel
      $active={false}
      $isCompact={isMinimized}
      $isDarkMode={theme === ThemeMode.DARK}
      $isOver={false}
      $primaryAction={primaryAction}
      className={className}
      data-test={dataTest}
      onClick={onClick}
    >
      <IconText
        color={primaryAction ? color : 'secondary'}
        label={isMinimized ? '' : label}
        startIcon={icon}
        weight={TypographyWeight.REGULAR}
      />
      <Typography color={primaryAction ? 'primary' : 'secondary'} size={TypographySize.SMALL}>
        {endLabel}
      </Typography>
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

export default ActionSidebarItem;
