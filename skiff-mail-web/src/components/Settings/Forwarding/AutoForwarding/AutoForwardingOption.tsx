import { Button, IconProps, Icons, Size, Type, Typography, TypographySize } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

const ICON_CONTAINER_SIZE = isMobile ? 35 : 42;

const OptionContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
`;

const AutoForwardClientIcon = styled.div`
  aspect-ratio: 1;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  place-items: center;

  width: ${ICON_CONTAINER_SIZE}px;
  height: ${ICON_CONTAINER_SIZE}px;

  border-radius: 8px;
  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
`;

const Textbox = styled.div`
  width: 100%;
  gap: 2px;
  display: flex;
  flex-direction: column;
`;

const EnableDisableButton = styled(Button)`
  // Fix the button width so that it's always the same size
  // no matter if it says "enable" or "disable
  width: 88px;
`;

interface AutoForwardingOptionProps {
  label: string;
  icon: IconProps['icon'];
  onClick: (e?: React.MouseEvent) => void;
  isEnabled: boolean;
  iconColor?: IconProps['color'];
  subLabel?: string;
}

export const AutoForwardingOption: React.FC<AutoForwardingOptionProps> = ({
  label,
  icon,
  onClick,
  isEnabled,
  iconColor,
  subLabel
}: AutoForwardingOptionProps) => {
  return (
    <OptionContainer>
      <AutoForwardClientIcon>
        <Icons color={iconColor} icon={icon} size={Size.X_MEDIUM} />
      </AutoForwardClientIcon>
      <Textbox>
        <Typography>{label}</Typography>
        {subLabel && (
          <Typography color='tertiary' size={TypographySize.SMALL}>
            {subLabel}
          </Typography>
        )}
      </Textbox>
      <EnableDisableButton onClick={onClick} type={isEnabled ? Type.DESTRUCTIVE : Type.SECONDARY}>
        {isEnabled ? 'Disable' : 'Enable'}
      </EnableDisableButton>
    </OptionContainer>
  );
};
