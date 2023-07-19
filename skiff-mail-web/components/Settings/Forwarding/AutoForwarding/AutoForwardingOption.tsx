import { Button, IconProps, Icons, Size, Type, Typography, TypographySize } from '@skiff-org/skiff-ui';
import styled from 'styled-components';

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

  width: 42px;
  height: 42px;

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
        <Typography mono uppercase>
          {label}
        </Typography>
        {subLabel && (
          <Typography mono uppercase color='tertiary' size={TypographySize.SMALL}>
            {subLabel}
          </Typography>
        )}
      </Textbox>
      <Button onClick={onClick} type={Type.SECONDARY}>
        {isEnabled ? 'Disable' : 'Enable'}
      </Button>
    </OptionContainer>
  );
};
