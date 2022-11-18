/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FC } from 'react';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import darkBlurSvg from './svgs/dark-blur.svg';
import darkModeSvg from './svgs/dark-mode.svg';
import emptyInboxSvg from './svgs/empty-inbox.svg';
import lightBlurSvg from './svgs/light-blur.svg';
import lightModeSvg from './svgs/light-mode.svg';

export enum Illustrations {
  EmptyMailbox,
  DarkMode,
  LightMode,
  Blur
}

const IllustrationsSvgs = {
  [Illustrations.EmptyMailbox]: { light: emptyInboxSvg, dark: emptyInboxSvg },
  [Illustrations.DarkMode]: { light: darkModeSvg, dark: darkModeSvg },
  [Illustrations.LightMode]: { light: lightModeSvg, dark: lightModeSvg },
  [Illustrations.Blur]: { light: lightBlurSvg, dark: darkBlurSvg }
};

const StyledIllustration = styled.span<{ scale: number }>`
  display: inline-flex;
  transform: ${(props) => `scale(${props.scale})`};
  svg {
    width: unset;
  }
`;

export interface IllustrationProps {
  illustration: Illustrations;
  scale?: number;
}

const Illustration: FC<IllustrationProps> = ({ illustration, scale = 1 }) => {
  const { theme } = useTheme();
  const IllustrationComp = IllustrationsSvgs[illustration][theme];

  return (
    <StyledIllustration scale={scale}>
      <IllustrationComp />
    </StyledIllustration>
  );
};

export default Illustration;
