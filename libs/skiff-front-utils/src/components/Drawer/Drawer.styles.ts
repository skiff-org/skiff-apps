import isNumber from 'lodash/isNumber';
import { getThemedColor, ThemeMode } from 'nightwatch-ui';
import styled, { css } from 'styled-components';

export const DRAWER_PAPER_CSS = ({
  $forceTheme,
  $verticalScroll,
  $borderRadius
}: {
  $forceTheme: ThemeMode;
  $verticalScroll: boolean;
  $borderRadius?: string | number;
}) => {
  let borderRadius = '16px';
  if (!!$borderRadius) {
    borderRadius = isNumber($borderRadius) ? `${$borderRadius}px` : $borderRadius;
  }

  return css`
    border-radius: ${borderRadius} ${borderRadius} 0 0;
    background: ${getThemedColor('var(--bg-l3-solid)', $forceTheme)} !important;
    box-shadow: ${getThemedColor('var(--skiff-drawer-shadow)', $forceTheme)};
    overflow-y: ${$verticalScroll ? 'visible' : 'hidden'};
  `;
};

export const TITLE_CSS = css`
  padding: 4px 8px 8px 8px;
  text-transform: uppercase;
`;

export const DrawerOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const DrawerBlocksContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  gap: 8px;
`;

export const DrawerOption = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-self: flex-end;
  width: 100%;
  border-radius: 8px;
  box-sizing: border-box;
  cursor: pointer;

  .dropdownItem {
    // remove right/left padding
    padding: 8px 0;
  }
`;
