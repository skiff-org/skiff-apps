import { ACCENT_COLOR_VALUES, TEXT_COLOR_VALUES, ThemeMode, colors, getThemedColor } from 'nightwatch-ui';
import { TYPOGRAPHY_SMALL_CSS } from 'nightwatch-ui';
import { css } from 'styled-components';

import {
  DAY_PICKER_BASE_WIDTH,
  DAY_PICKER_SIZE,
  WEEK_START_END_DATE_MARGIN,
  WEEK_START_END_DATE_WIDTH
} from './DatePicker.constants';

export const DAY_PICKER_BUTTON_CSS = css`
  width: ${DAY_PICKER_SIZE}px;
  height: ${DAY_PICKER_SIZE}px;
  border-radius: 8px;
`;

export const DAY_PICKER_LABEL_CSS = css`
  font-family: 'Skiff Sans Text';
  font-weight: 380;
  ${TYPOGRAPHY_SMALL_CSS}

  height: ${DAY_PICKER_SIZE}px;
  width: ${DAY_PICKER_BASE_WIDTH}px;
  margin: 0;
  justify-self: center;
`;

const ACTIVE_DAY_CSS = (bgColor: string) => css`
  font-weight: 560; // Overrides default font-weight
  z-index: 1;

  &::after {
    background: ${bgColor};
    z-index: -1;
  }
`;

/** Returns the CSS for Today */
const TODAY_CSS = css`
  color: ${TEXT_COLOR_VALUES.white} !important;
  ${ACTIVE_DAY_CSS(`rgb(${colors['--orange-500']})`)};
`;

/** Returns the CSS for days that are not Today */
const NON_TODAY_CSS = ({ $forceTheme }: { $forceTheme?: ThemeMode }) => css`
  &.Mui-selected {
    color: ${getThemedColor(TEXT_COLOR_VALUES.link, $forceTheme)} !important;
    ${ACTIVE_DAY_CSS(getThemedColor(ACCENT_COLOR_VALUES.orange[1], $forceTheme))}
  }

  &:not(.Mui-selected):hover::after {
    background: ${getThemedColor('var(--cta-secondary-hover)', $forceTheme)};
  }
`;

/**
 * Returns the CSS for a day picker depending on its type - Today or not today
 * We separate Today from Not today because the Today day picker should retain its styling regardless of whether or not it's hovered or selected
 */
export const DAY_TYPE_CSS = ({ $isToday }: { $isToday: boolean; $forceTheme?: ThemeMode }) => css`
  &::after {
    position: absolute;
    content: '';
    ${DAY_PICKER_BUTTON_CSS};
  }
  ${$isToday && TODAY_CSS}
  ${!$isToday && NON_TODAY_CSS}
`;

const WEEK_START_DATE_CSS = css`
  &::before {
    width: ${WEEK_START_END_DATE_WIDTH}px;
    border-top-right-radius: 0px;
    border-bottom-right-radius: 0px;
    margin-left: ${WEEK_START_END_DATE_MARGIN}px;
  }
`;

const WEEK_END_DATE_CSS = css`
  &::before {
    width: ${WEEK_START_END_DATE_WIDTH}px;
    border-top-left-radius: 0px;
    border-bottom-left-radius: 0px;
    margin-right: ${WEEK_START_END_DATE_MARGIN}px;
  }
`;

const MID_WEEK_DATE_CSS = css`
  &::before {
    width: 100%;
    border-radius: 0px;
  }
`;

/**
 * Returns the CSS for a day picker within the curr week
 * Day pickers within the curr week all override default border-radius
 */
export const WEEK_DAY_CSS = ({
  $isWeekStartDate,
  $isWeekEndDate,
  $forceTheme
}: {
  $isWeekStartDate: boolean;
  $isWeekEndDate: boolean;
  $forceTheme?: ThemeMode;
}) => {
  return css`
    &::before {
      position: absolute;
      content: '';
      height: 100%;
      background: ${getThemedColor('var(--bg-cell-hover)', $forceTheme)} !important;
      border-radius: 8px;
    }

    ${$isWeekStartDate && WEEK_START_DATE_CSS}
    ${$isWeekEndDate && WEEK_END_DATE_CSS}
    ${!$isWeekStartDate && !$isWeekEndDate && MID_WEEK_DATE_CSS}
  `;
};
