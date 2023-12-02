import { FloatingDelayGroup } from '@floating-ui/react-dom-interactions';
import { Icon, Icons, Size, Tooltip, TooltipContent, TooltipTrigger, Typography, TypographySize } from 'nightwatch-ui';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled, { css } from 'styled-components';

import { DnsRecordColumnHeader } from '../../../utils/customDomainUtils';

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

const StyledTypography = styled(Typography)`
  /* underline */
  text-decoration: underline;
  text-decoration-color: var(--accent-red-secondary);
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
  text-decoration-skip-ink: none;
`;

const CopyContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  width: 100%;
`;

const Spacer = styled.div`
  height: 16px;
`;

interface ValueDescriptionTextProps {
  value: string;
  header?: boolean;
  headerName?: DnsRecordColumnHeader;
  width?: 'normal' | 'short' | 'long';
  showErrorStyling?: boolean; // whether to use in-line color changes to highlight an erroneous value
  incorrectData?: string;
  errorDetailView?: boolean; // whether this value is part of an specialized table highlighting incorrect records
}
// Small sub-component with Value and Description stacked text
const ValueDescriptionText: React.FC<ValueDescriptionTextProps> = ({
  value,
  header,
  headerName,
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
      return showErrorStyling ? 'red' : 'disabled';
    }
    if (showCopiedText || isHovering) {
      return 'primary';
    }
    if (!showErrorStyling) {
      return 'secondary';
    }
    return 'secondary';
  };

  const copiableText = (hideCopy?: boolean) => (
    <CopyContainer onClick={header ? undefined : copyValueToClipboard}>
      <Typography
        color={getTextColor()}
        mono={!!header}
        size={isMobile ? TypographySize.CAPTION : TypographySize.SMALL}
        wrap
      >
        {showCopiedText ? 'Copied' : value}
      </Typography>
      {!hideCopy && !header && !!copyValueToClipboard && (
        <Icons color={getTextColor()} icon={showCopiedText ? Icon.Check : Icon.Copy} size={Size.X_SMALL} />
      )}
    </CopyContainer>
  );

  return isMobile || errorDetailView ? (
    <ValueDescriptionContainer $width={getWidthPx()}>
      {incorrectData && (
        <FloatingDelayGroup delay={{ open: 0, close: 200 }}>
          <Tooltip>
            <TooltipContent>{`Incorrect ${headerName?.toLowerCase() || ''}`}</TooltipContent>
            <TooltipTrigger>
              <TextAndCorrectnessIcon>
                <StyledTypography color='red' size={isMobile ? TypographySize.CAPTION : TypographySize.SMALL}>
                  {incorrectData}
                </StyledTypography>
                <Icons color='red' icon={Icon.Warning} size={Size.X_SMALL} />
              </TextAndCorrectnessIcon>
            </TooltipTrigger>
          </Tooltip>
        </FloatingDelayGroup>
      )}
      {!incorrectData && !header && <Spacer />}
      <TextAndCorrectnessIcon onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
        {copiableText(!incorrectData)}
      </TextAndCorrectnessIcon>
    </ValueDescriptionContainer>
  ) : (
    <ValueDescriptionContainer $width={getWidthPx()} onMouseOut={handleMouseOut} onMouseOver={handleMouseOver}>
      {copiableText(!incorrectData)}
    </ValueDescriptionContainer>
  );
};

export default ValueDescriptionText;
