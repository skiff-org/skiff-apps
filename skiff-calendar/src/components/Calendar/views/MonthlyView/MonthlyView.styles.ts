import { isMobile } from 'react-device-detect';
import { css } from 'styled-components';

import { EVENT_CARD_HEIGHT } from './MonthlyView.constants';

export const CARD_CONTAINER_CSS = css`
  padding: 0 ${isMobile ? 2 : 4}px;
  box-sizing: border-box;

  // We disable all event card interactions on Mobile
  ${isMobile && 'pointer-events: none;'}
`;

export const CARD_CSS = css`
  display: flex;
  cursor: pointer;

  border-radius: 2px;
  border: 1px solid transparent;
  height: ${EVENT_CARD_HEIGHT}px;
  padding: 2px 0 2px ${isMobile ? 2 : 6}px;
  box-sizing: border-box;

  // We don't want to show ellipses when the title overflows
  overflow: hidden;
`;
