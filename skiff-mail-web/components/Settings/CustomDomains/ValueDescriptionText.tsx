import { Typography, TypographySize, Icons, Icon, Size } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

const ValueDescriptionContainer = styled.div<{ $width?: number }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: ${isMobile ? '2' : '4'}px;
  ${(props) =>
    props.$width &&
    css`
      width: ${props.$width}%;
    `}
`;

const TextAndCorrectnessIcon = styled.div<{ $width?: number }>`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 16px;
  width: 100%;
`;

interface ValueDescriptionTextProps {
  value: string;
  header?: boolean;
  width?: 'normal' | 'short' | 'long';
  showErrorStyling?: boolean; // whether to use in-line color changes to highlight an erroneous value
  incorrectData?: string;
  errorDetailView?: boolean; // whether this value is part of an specialized table highlighting incorrect records
}
// Small sub-component with Value and Description stacked text
const ValueDescriptionText: React.FC<ValueDescriptionTextProps> = ({
  value,
  header,
  width = 'normal',
  incorrectData,
  showErrorStyling,
  errorDetailView
}: ValueDescriptionTextProps) => {
  const getWidthPx = () => {
    if (isMobile) return 86;
    // on errorDetailView, this needs to add up to 90% across 2x short, 1x long, 1x normal
    // on standard view, it needs to add up to 88%
    switch (width) {
      case 'short':
        return errorDetailView ? 10 : 14;
      case 'normal':
        return errorDetailView ? 22 : 20;
      case 'long':
        return errorDetailView ? 48 : 40;
    }
  };

  const [isHovering, setIsHovering] = useState(false);
  const [showCopiedText, setShowCopiedText] = useState(false);
  const SHOW_COPIED_TEXT_DELAY_IN_MS = 1000;
  const handleMouseOver = () => setIsHovering(true);
  const handleMouseOut = () => setIsHovering(false);

  const copyValueToClipboard = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    void navigator.clipboard.writeText(value);
    setShowCopiedText(true);
    setTimeout(() => {
      setShowCopiedText(false);
      setIsHovering(false);
    }, SHOW_COPIED_TEXT_DELAY_IN_MS);
  };

  const getTextColor = () => {
    if (header) {
      return 'disabled';
    }
    if (showCopiedText || isHovering) {
      return 'primary';
    }
    if (!showErrorStyling) {
      return 'secondary';
    }
    return !!incorrectData ? 'green' : 'red';
  };

  const copiableText = () => (
    <Typography
      color={getTextColor()}
      mono={!!header}
      onClick={header ? undefined : copyValueToClipboard}
      size={isMobile ? TypographySize.CAPTION : TypographySize.SMALL}
    >
      {showCopiedText ? 'Copied' : value}
    </Typography>
  );

  return isMobile || errorDetailView ? (
    <ValueDescriptionContainer $width={getWidthPx()}>
      {incorrectData && (
        <TextAndCorrectnessIcon>
          <Typography color='red' size={isMobile ? TypographySize.CAPTION : TypographySize.SMALL}>
            {incorrectData}
          </Typography>
          <Icons color='red' icon={Icon.Warning} size={Size.X_SMALL} />
        </TextAndCorrectnessIcon>
      )}
      <TextAndCorrectnessIcon onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
        {copiableText()}
        {incorrectData && !showCopiedText && <Icons color='green' icon={Icon.Check} size={Size.X_SMALL} />}
      </TextAndCorrectnessIcon>
    </ValueDescriptionContainer>
  ) : (
    <ValueDescriptionContainer $width={getWidthPx()} onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
      {copiableText()}
    </ValueDescriptionContainer>
  );
};

export default ValueDescriptionText;
