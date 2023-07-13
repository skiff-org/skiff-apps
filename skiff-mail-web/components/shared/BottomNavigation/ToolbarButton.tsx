import { Icon, Icons, Size, Typography } from '@skiff-org/skiff-ui';
import { MouseEventHandler } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

interface ToolbarButtonProps {
  icon?: Icon;
  onClick?: MouseEventHandler<HTMLDivElement>;
  label?: string;
  link?: boolean;
  disabled?: boolean;
}

const BottomNavigationAction = styled.div`
  min-width: auto;
  margin: auto;
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 12px;
  border-radius: 24px;
  ${isMobile && '-webkit-user-select: none;'}
  &:active {
    background: var(--bg-cell-hover);
  }
`;

const EnlargeIcon = styled.div`
  transform: scale(1.25);
`;

export default function ToolbarButton({ icon, label, onClick, link, disabled }: ToolbarButtonProps) {
  const iconColor = disabled ? 'disabled' : 'primary';
  return (
    <BottomNavigationAction onClick={disabled ? undefined : onClick}>
      {icon && (
        <EnlargeIcon>
          <Icons color={link ? 'link' : iconColor} icon={icon} size={Size.X_MEDIUM} />
        </EnlargeIcon>
      )}
      {!!label && <Typography color={link ? 'link' : iconColor}>{label}</Typography>}
    </BottomNavigationAction>
  );
}
