import React, { FC } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

const InnerContainerStyle = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translateX(-50%) translateY(-50%);
  max-width: 80%;
  max-height: 100%;

  ${isMobile &&
  `
    position: relative;
    max-width: 100%;
    display: flex;
    justify-content: center;
  `}
`;

export const InnerContainer: FC = ({ children }) => (
  <InnerContainerStyle
    onClick={(e) => {
      e.stopPropagation();
    }}
  >
    {children}
  </InnerContainerStyle>
);
