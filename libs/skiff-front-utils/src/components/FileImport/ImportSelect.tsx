import { Button, IconProps, Icons, IconText, Size, Type, Typography, TypographySize } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

interface ImportSelectProps {
  label: string;
  icon: IconProps['icon'];
  onClick: (e?: React.MouseEvent) => void;
  iconColor?: IconProps['color'];
  color?: 'primary' | 'secondary' | 'tertiary';
  sublabel?: string;
  dataTest?: string;
  disabled?: boolean;
  compact?: boolean;
  wrap?: boolean;
  onClickLabel?: string;
  destructive?: boolean;
}

const LargeItemContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  box-sizing: border-box;
  width: 100%;
`;

const ImportClientIcon = styled.div`
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
`;

const ImportSelect: React.FC<ImportSelectProps> = ({
  icon,
  compact,
  label,
  sublabel,
  onClick,
  dataTest,
  color,
  disabled,
  iconColor,
  wrap = false,
  onClickLabel,
  destructive
}) => {
  const displayIcon = !isMobile;

  const renderCompactButton = () => (
    <IconText
      color={color}
      disabled={disabled}
      iconColor={iconColor}
      label={label}
      onClick={onClick}
      startIcon={displayIcon ? icon : undefined}
    />
  );

  const renderFullButton = () => (
    <LargeItemContainer>
      {displayIcon && (
        <ImportClientIcon>
          <Icons color={iconColor} disabled={disabled} icon={icon} size={Size.X_MEDIUM} />
        </ImportClientIcon>
      )}
      <Textbox>
        <Typography color={disabled ? 'disabled' : color}>{label}</Typography>
        {sublabel && (
          <Typography color={disabled ? 'disabled' : 'tertiary'} size={TypographySize.SMALL} wrap={wrap}>
            {sublabel}
          </Typography>
        )}
      </Textbox>
      <div>
        <Button
          dataTest={dataTest}
          disabled={disabled}
          onClick={onClick}
          type={destructive ? Type.DESTRUCTIVE : Type.SECONDARY}
        >
          {onClickLabel || 'Import'}
        </Button>
      </div>
    </LargeItemContainer>
  );

  return (
    <>
      {compact && renderCompactButton()}
      {!compact && renderFullButton()}
    </>
  );
};

export default ImportSelect;
