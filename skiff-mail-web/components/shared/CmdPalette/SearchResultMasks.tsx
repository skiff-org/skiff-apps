import styled from 'styled-components';

export const BackgroundActiveMask = styled.div<{ rowHeight: number }>`
  background: rgba(255, 255, 255, 0.12);
  height: ${(props) => props.rowHeight}px;
  border-radius: 12px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;

export const BackgroundHoverMask = styled.div<{ rowHeight: number }>`
  background: rgba(255, 255, 255, 0.08);
  height: ${(props) => props.rowHeight}px;
  border-radius: 12px;
  width: 100%;
  position: absolute;
  margin: 0 auto;
`;
