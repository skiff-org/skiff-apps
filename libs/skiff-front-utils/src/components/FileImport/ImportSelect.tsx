import {
  Button,
  FilledVariant,
  Icon,
  IconProps,
  Icons,
  IconText,
  Size,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

interface ImportSelectProps {
  label: string;
  icon: IconProps['icon'];
  onClick: (e?: React.MouseEvent) => void;
  iconColor?: IconProps['color'];
  color?: 'primary' | 'secondary' | 'tertiary';
  subLabel?: string;
  dataTest?: string;
  disabled?: boolean;
  compact?: boolean;
  wrap?: boolean;
  onClickLabel?: string;
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
  gap: 2px;
  display: flex;
  flex-direction: column;
`;

const ImportSelect: React.FC<ImportSelectProps> = ({
  icon,
  compact,
  label,
  subLabel,
  onClick,
  dataTest,
  color,
  disabled,
  iconColor,
  wrap = false,
  onClickLabel
}) => {
  const renderCompactButton = () => (
    <IconText
      color={color}
      disabled={disabled}
      label={label}
      onClick={onClick}
      variant={FilledVariant.FILLED}
      startIcon={!isMobile ? <Icons color={iconColor} icon={icon} /> : undefined}
    />
  );

  const renderImportButton = () => {
    if (isMobile) return <Icons color='secondary' icon={Icon.ChevronRight} />;
    return (
      <Button disabled={disabled} onClick={onClick} type={Type.SECONDARY}>
        {onClickLabel || 'Import'}
      </Button>
    );
  };

  const renderFullButton = () => (
    <LargeItemContainer data-test={dataTest} onClick={isMobile ? onClick : undefined}>
      <ImportClientIcon>
        <Icons color={iconColor} disabled={disabled} icon={icon} size={Size.X_MEDIUM} />
      </ImportClientIcon>
      <Textbox>
        <Typography color={disabled ? 'disabled' : color}>{label}</Typography>
        {subLabel && (
          <Typography color={disabled ? 'disabled' : 'tertiary'} size={TypographySize.SMALL} wrap={wrap}>
            {subLabel}
          </Typography>
        )}
      </Textbox>
      {renderImportButton()}
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
