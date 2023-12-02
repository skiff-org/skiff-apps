import { ThemeMode, getThemedColor } from 'nightwatch-ui';
import styled, { css } from 'styled-components';

import { CHIP_TYPOGRAPHY_PADDING, FILTER_CONDITION_CHIP_HEIGHT } from '../Filters.constants';

export const ChipContainer = styled.div<{ $canEdit?: boolean; $emphasize?: boolean }>`
  display: flex;
  border: 1px solid var(--border-secondary);
  border-radius: 32px;
  align-items: center;
  box-sizing: border-box;
  height: ${FILTER_CONDITION_CHIP_HEIGHT}px;
  background: ${({ $emphasize }) => ($emphasize ? 'var(--bg-emphasis)' : 'var(--bg-l2-solid)')};
  user-select: none;
  max-width: 100%;
`;

export const ChipTypography = styled.div`
  padding: 0 ${CHIP_TYPOGRAPHY_PADDING}px;
  min-width: 0;
`;

export const labelStyling = css<{ $canEdit?: boolean; $emphasize?: boolean }>`
  height: 100%;
  display: flex;
  align-items: center;
  ${({ $canEdit, $emphasize }) =>
    $canEdit &&
    css`
      cursor: pointer;
      &:hover {
        background: ${$emphasize ? getThemedColor('var(--cta-chip-hover)', ThemeMode.DARK) : 'var(--cta-chip-hover)'};
      }
    `}
`;
