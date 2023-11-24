import React from 'react';
import styled from 'styled-components';

import { CARD_CONTAINER_CSS, CARD_CSS } from '../MonthlyView.styles';

const CardContainer = styled.div<{ $isGhost: boolean }>`
  ${CARD_CONTAINER_CSS}
  visibility: hidden;
`;

const Card = styled.div`
  ${CARD_CSS}
`;

/** Ghost cards are hidden cards that allow correct positioning of other events within the day cell */
function GhostEventCard() {
  return (
    <CardContainer $isGhost>
      <Card />
    </CardContainer>
  );
}

export default GhostEventCard;
