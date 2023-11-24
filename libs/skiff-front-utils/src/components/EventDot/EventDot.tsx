import styled, { css } from 'styled-components';

import { useTheme } from '../../theme/AppThemeProvider';
import { getEventColors } from '../../utils';

import { EVENT_DOT_CLASS_NAME, EVENT_DOT_CONTAINER_HEIGHT, EventDotType } from './EventDot.constants';
import { EventDotProps } from './EventDot.types';

const DotContainer = styled.div`
  width: fit-content;
  height: ${EVENT_DOT_CONTAINER_HEIGHT}px;

  display: flex;
  align-items: center;
  justify-content: center;
`;

const Dot = styled.div<{
  $dotColor: string;
  $type: EventDotType;
  $isFaded: boolean;
}>`
  width: 8px;
  height: 8px;

  box-sizing: border-box;
  border-radius: 50%;

  display: flex;
  align-items: center;
  justify-content: center;

  ${({ $dotColor, $type }) => `
      background: ${$type === EventDotType.FILLED ? $dotColor : 'transparent'};
      border: ${$type === EventDotType.FILLED ? 'none' : `1px solid ${$dotColor}`};
    `}
`;

// For "maybe" events
const InnerDot = styled.div<{ $dotColor: string }>`
  border-radius: inherit;
  border: 2px solid transparent;
  background: ${({ $dotColor }) => $dotColor};
`;

const CROSS_CSS = ({ $dotColor }: { $dotColor: string }) => css`
  content: '';
  height: 60%;
  border-left: 1px solid ${$dotColor};
  position: absolute;
  left: 2.5px;
  top: 1.5px;
  border-radius: 25%;
`;

// For rejected events
const InnerCross = styled.div<{ $dotColor: string }>`
  width: inherit;
  height: inherit;
  position: relative;

  :after {
    ${CROSS_CSS}
    transform: rotate(45deg);
  }

  :before {
    ${CROSS_CSS}
    transform: rotate(-45deg);
  }
`;

const EventDot: React.FC<EventDotProps> = ({
  color,
  type = EventDotType.FILLED,
  className = '',
  forceTheme,
  isFaded = false,
  isInAllEventsDropdown = false,
  isSelected = false
}: EventDotProps) => {
  const { theme } = useTheme();
  const [primaryColor] = getEventColors(color, forceTheme ?? theme, isFaded);
  const selectedColor = isInAllEventsDropdown ? primaryColor : 'var(--text-inverse)';
  const dotColor = isSelected ? selectedColor : primaryColor;
  return (
    <DotContainer className={className}>
      <Dot $dotColor={dotColor} $isFaded={isFaded} $type={type} className={EVENT_DOT_CLASS_NAME}>
        {type === EventDotType.EMPTY_WITH_DOT && <InnerDot $dotColor={dotColor} />}
        {type === EventDotType.EMPTY_WITH_CROSS && <InnerCross $dotColor={dotColor} />}
      </Dot>
    </DotContainer>
  );
};

export default EventDot;
