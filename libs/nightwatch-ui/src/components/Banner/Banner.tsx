import React from 'react';
import styled from 'styled-components';

import { Size, ThemeMode } from '../../types';
import { getAccentColorValues, getThemedColor } from '../../utils/colorUtils';
import Divider, { DividerType } from '../Divider';
import Icons, { Icon } from '../Icons';
import IconText from '../IconText';
import Typography, { TypographySize } from '../Typography';

import { BANNER_HEIGHT } from './Banner.constants';
import { BannerProps } from './Banner.types';

const BannerContainer = styled.div<{ $color: string }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  box-sizing: border-box;
  padding: 0px 12px;
  height: ${BANNER_HEIGHT}px;
  background: ${(props) => props.$color};
`;

const BannerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0px;
`;

const IconOverlay = styled.div<{ $forceTheme?: ThemeMode }>`
  padding: 4px;
  border-radius: 20px;
  background: ${(props) => getThemedColor('var(--bg-overlay-primary)', props.$forceTheme)};
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

export default function Banner({ label, color = 'blue', ctas, icon, forceTheme, onClose }: BannerProps) {
  const primaryColor = getAccentColorValues(color)[0];

  return (
    <BannerContainer $color={primaryColor}>
      <BannerHeader>
        {icon && (
          <IconOverlay $forceTheme={forceTheme}>
            <Icons icon={icon} forceTheme={forceTheme} />
          </IconOverlay>
        )}
        <Typography size={TypographySize.SMALL} forceTheme={forceTheme}>
          {label}
        </Typography>
      </BannerHeader>
      <ActionButtons>
        {ctas?.map((cta, index) => (
          <>
            <IconText
              color='secondary'
              key={label}
              size={Size.SMALL}
              onClick={cta.onClick}
              label={cta.label}
              forceTheme={forceTheme}
            />
            {(index < ctas.length - 1 || !!onClose) && (
              <Divider height='16px' type={DividerType.VERTICAL} forceTheme={forceTheme} color='primary' />
            )}
          </>
        ))}
        {!!onClose && <IconText startIcon={Icon.Close} onClick={onClose} color='secondary' forceTheme={forceTheme} />}
      </ActionButtons>
    </BannerContainer>
  );
}
