import { css } from 'styled-components';

import { Size } from '../../types';

import { TabsSize } from './Tabs.constants';

/** Small / Medium Tabs container styles */
const SMALL_MEDIUM_TABS_CONTAINER_CSS = css`
  border-radius: 8px;
`;

/** Large Tabs container styles */
const LARGE_TABS_CONTAINER_CSS = css`
  border-radius: 10px;
`;

/** Returns size-specific Tabs container CSS */
export const TABS_CONTAINER_CSS = ({ $size }: { $size: TabsSize }) => {
  switch ($size) {
    case Size.LARGE:
      return LARGE_TABS_CONTAINER_CSS;
    case Size.SMALL:
    case Size.MEDIUM:
    default:
      return SMALL_MEDIUM_TABS_CONTAINER_CSS;
  }
};

/** Small Tab Cell styles */
const SMALL_TAB_CELL_CSS = css`
  padding: 4px 8px;
`;

/** Medium Tab Cell styles */
const MEDIUM_TAB_CELL_CSS = css`
  padding: 4px 16px;
`;

/** Large Tab Cell styles */
const LARGE_TAB_CELL_CSS = css`
  padding: 6px 24px;
`;

/** Returns size-specific Tab Cell CSS */
export const TAB_CELL_CSS = ({ $size }: { $size: TabsSize }) => {
  switch ($size) {
    case Size.SMALL:
      return SMALL_TAB_CELL_CSS;
    case Size.LARGE:
      return LARGE_TAB_CELL_CSS;
    case Size.MEDIUM:
    default:
      return MEDIUM_TAB_CELL_CSS;
  }
};

/** Small / Medium Slider styles */
const SMALL_MEDIUM_SLIDER_CSS = css`
  border-radius: 6px;
`;

/** Large Slider styles */
const LARGE_SLIDER_CSS = css`
  border-radius: 8px;
`;

/** Returns size-specific Slider CSS */
export const SLIDER_CSS = ({ $size }: { $size: TabsSize }) => {
  switch ($size) {
    case Size.LARGE:
      return LARGE_SLIDER_CSS;
    case Size.SMALL:
    case Size.MEDIUM:
    default:
      return SMALL_MEDIUM_SLIDER_CSS;
  }
};
