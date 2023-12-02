import { AccentColor, ThemeMode, Typography } from 'nightwatch-ui';
import { FADED_EVENT_OPACITY, getEventColors } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { getDiagonalStripes, getHoveredEventBackground } from './utils';
import { HOVER_EFFECT_CLASS_NAME } from './views.constants';

const UNSELECTED_MAYBE_EVENT_CARD_CSS = ({
  $color,
  $isFaded,
  $themeMode,
  $isSelected,
  $showHover
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $themeMode: ThemeMode;
  $isSelected?: boolean;
  $showHover?: boolean;
}) => {
  const [, secondaryColor] = getEventColors($color, $themeMode, $isFaded);
  const diagonalStripes = getDiagonalStripes($color, 'transparent', $themeMode, $isSelected);
  let backgroundStyles = `
    background: ${secondaryColor} ${diagonalStripes};
  `;

  if ($showHover) {
    const hoverBg = getHoveredEventBackground($color, true, $isFaded);
    backgroundStyles += `
      &.${HOVER_EFFECT_CLASS_NAME},
      &:hover {
        background: ${hoverBg} ${diagonalStripes};
        background-size: 24px 24px;
      }
    `;
  }

  return css`
    ${backgroundStyles}
  `;
};

const SELECTED_MAYBE_EVENT_CARD_CSS = ({
  $color,
  $themeMode,
  $isSelected
}: {
  $color: AccentColor;
  $themeMode: ThemeMode;
  $isSelected?: boolean;
}) => {
  const [primaryColor] = getEventColors($color, $themeMode, false);
  return css`
    background-image: ${getDiagonalStripes($color, primaryColor, $themeMode, $isSelected)};
  `;
};

export const MAYBE_EVENT_CARD_CSS = ({
  $isSelected
}: {
  $color: AccentColor;
  $themeMode: ThemeMode;
  $isSelected?: boolean;
}) => css`
  ${$isSelected ? SELECTED_MAYBE_EVENT_CARD_CSS : UNSELECTED_MAYBE_EVENT_CARD_CSS}
  background-size: 24px 24px;
`;

const SELECTED_CONFIRMED_EVENT_CARD_CSS = ({ $color, $themeMode }: { $color: AccentColor; $themeMode: ThemeMode }) => {
  const [primaryColor] = getEventColors($color, $themeMode, false);
  return css`
    background: ${primaryColor};
  `;
};

const UNSELECTED_CONFIRMED_EVENT_CARD_CSS = ({
  $color,
  $isFaded,
  $themeMode,
  $showHover
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $themeMode: ThemeMode;
  $showHover?: boolean;
}) => {
  const [, secondaryColor] = getEventColors($color, $themeMode, $isFaded);
  let backgroundStyles = `background: ${secondaryColor};`;

  if ($showHover) {
    const hoverBg = getHoveredEventBackground($color, true, $isFaded);
    backgroundStyles += `
      &.${HOVER_EFFECT_CLASS_NAME},
      &:hover {
        background: ${hoverBg};
      }
    `;
  }

  return css`
    ${backgroundStyles}
  `;
};

export const CONFIRMED_EVENT_CARD_CSS = ({
  $isSelected
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $themeMode: ThemeMode;
  $isSelected?: boolean;
}) => ($isSelected ? SELECTED_CONFIRMED_EVENT_CARD_CSS : UNSELECTED_CONFIRMED_EVENT_CARD_CSS);

const SELECTED_PENDING_OR_DECLINED_EVENT_CARD_CSS = ({
  $color,
  $isFaded,
  $themeMode
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $themeMode: ThemeMode;
}) => {
  const [, secondaryColor] = getEventColors($color, $themeMode, $isFaded);
  return css`
    background: ${secondaryColor};
  `;
};

const UNSELECTED_PENDING_OR_DECLINED_EVENT_CARD_CSS = ({
  $color,
  $isFaded,
  $bgColor,
  $showHover
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $bgColor?: string;
  $showHover?: boolean;
}) => {
  let backgroundStyles = `background: ${$bgColor ?? 'transparent'};`;

  if ($showHover) {
    const hoverBg = getHoveredEventBackground($color, false, $isFaded);
    backgroundStyles += `
      &.${HOVER_EFFECT_CLASS_NAME},
      &:hover {
        background: ${hoverBg};
      }
    `;
  }

  return css`
    ${backgroundStyles}
  `;
};

export const PENDING_OR_DECLINED_EVENT_CARD_CSS = ({
  $color,
  $isFaded,
  $themeMode,
  $isSelected
}: {
  $color: AccentColor;
  $isFaded: boolean;
  $themeMode: ThemeMode;
  $isSelected?: boolean;
}) => {
  const [primaryColor] = getEventColors($color, $themeMode, $isFaded);
  return css`
    ${$isSelected ? SELECTED_PENDING_OR_DECLINED_EVENT_CARD_CSS : UNSELECTED_PENDING_OR_DECLINED_EVENT_CARD_CSS};
    border: 1px dashed ${primaryColor};
  `;
};

export const EVENT_CARD_TEXT_CSS = ({ $isFaded }: { $isFaded: boolean }) => css`
  ${$isFaded && `opacity: ${FADED_EVENT_OPACITY};`}
`;

export const StyledEventCardText = styled(Typography)<{ $isFaded: boolean }>`
  ${EVENT_CARD_TEXT_CSS};
`;
