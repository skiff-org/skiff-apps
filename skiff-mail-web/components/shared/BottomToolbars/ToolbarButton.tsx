import { Icon, Icons, Typography } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

interface ToolbarButtonProps {
  icon?: Icon;
  onClick?: (e: any) => void;
  label?: string;
  link?: boolean;
  disabled?: boolean;
}

const BottomNavigationAction = styled.div`
    min-width: auto;
    width: 100%;
    align-self: center;
    display: flex;
    justify-content: center;
`;

const EnlargeIcon = styled(Icons)`
    transform: scale(1.25)
`;

export default function ToolbarButton({ icon, label, onClick, link, disabled }: ToolbarButtonProps) {
  const iconColor = disabled ? 'disabled' : 'primary';
  return (
    <BottomNavigationAction
      onClick={disabled ? undefined : onClick}
    >
      {icon && <EnlargeIcon icon={icon} color={link ? 'link' : iconColor} size='large' />}
      {!!label && <Typography color={link ? 'link' : iconColor}>{label}</Typography>}
    </BottomNavigationAction>
  );
}
