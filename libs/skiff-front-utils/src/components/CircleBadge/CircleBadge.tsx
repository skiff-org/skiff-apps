import { Icon, IconColor, Icons, Size } from 'nightwatch-ui';
import styled from 'styled-components';

const Container = styled.div<{ $hideContainer?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $hideContainer }) => ($hideContainer ? 20 : 27)}px;
  height: ${({ $hideContainer }) => ($hideContainer ? 20 : 27)}px;
  border-radius: 6px;
  background: ${({ $hideContainer }) => ($hideContainer ? '' : 'var(--bg-l3-solid)')};
  box-shadow: ${({ $hideContainer }) => ($hideContainer ? '' : 'var(--shadow-l1)')};
  cursor: pointer;
  position: relative; // This will allow us to use absolute positioning for the child elements
`;

const Circle = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 21px;
  height: 21px;
  border-radius: 50%;
  border: 1px solid var(--border-secondary);
  box-sizing: border-box;
  background: var(--bg-overlay-tertiary);
  transform: translate(-50%, -50%);
`;

const HorizontalLine = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: var(--border-tertiary);
  transform: translateY(-50%);
`;

const VerticalLine = styled.div`
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  background: var(--border-tertiary);
  transform: translateX(-50%);
`;

interface CircleBadgeProps {
  icon: Icon;
  hideContainer?: boolean;
  onClick?: () => void;
  color?: IconColor;
  size?: Size;
}

export default function CircleBadge({ icon, onClick, color, size, hideContainer }: CircleBadgeProps) {
  return (
    <Container onClick={onClick} $hideContainer={hideContainer}>
      <Circle />
      <HorizontalLine />
      <VerticalLine />
      <Icons icon={icon} color={color} size={size} />
    </Container>
  );
}
