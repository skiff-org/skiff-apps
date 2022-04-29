import { FC } from 'react';
import styled from 'styled-components';

import emptyInboxSvg from './empty-inbox.svg';

export enum Illustrations {
  EmptyMailbox
}

const IllustrationsSvgs = {
  [Illustrations.EmptyMailbox]: emptyInboxSvg
};

const StyledIllustration = styled.span<{ scale: number; isMobile?: boolean }>`
  display: inline-flex;
  transform: ${(props) => `scale(${props.scale})`};
  ${(props) =>
    props.isMobile &&
    `svg{
    width: unset;
  }`}
`;

export interface IllustrationProps {
  illustration: Illustrations;
  scale?: number;
  isMobile?: boolean;
}

const Illustration: FC<IllustrationProps> = ({ illustration, scale = 1, isMobile }) => (
  <StyledIllustration scale={scale} isMobile={isMobile}>
    {IllustrationsSvgs[illustration]()}
  </StyledIllustration>
);

export default Illustration;
