/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FC } from 'react';
import { useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import customizeProfileSvg from './svgs/customize-profile.svg';
import darkMigrateSvg from './svgs/dark-mail-migrate.svg';
import darkModeSvg from './svgs/dark-mode.svg';
import emptyFilterSvg from './svgs/empty-filter.svg';
import lightMigrateSvg from './svgs/light-mail-migrate.svg';
import lightModeSvg from './svgs/light-mode.svg';
import noResultsFoundSvg from './svgs/no-results-found.svg';
import skiffLogoDarkSvg from './svgs/skiff-logo-dark-inset.svg';
import skiffLogoLightSvg from './svgs/skiff-logo-light-inset.svg';
import systemModeSelectSvg from './svgs/system-mode.svg';

export enum Illustrations {
  DarkMode,
  LightMode,
  SystemMode,
  DarkMigrate,
  LightMigrate,
  Blur,
  SkiffLockupIcon,
  NoResultsFound,
  CustomizeProfile,
  CustomDomain,
  FilterEmpty
}

const IllustrationsSvgs = {
  [Illustrations.DarkMode]: { light: darkModeSvg, dark: darkModeSvg },
  [Illustrations.LightMode]: { light: lightModeSvg, dark: lightModeSvg },
  [Illustrations.SystemMode]: { light: systemModeSelectSvg, dark: systemModeSelectSvg },
  [Illustrations.DarkMigrate]: { light: darkMigrateSvg, dark: darkMigrateSvg },
  [Illustrations.LightMigrate]: { light: lightMigrateSvg, dark: lightMigrateSvg },
  [Illustrations.SkiffLockupIcon]: { light: skiffLogoLightSvg, dark: skiffLogoDarkSvg },
  [Illustrations.NoResultsFound]: { light: noResultsFoundSvg, dark: noResultsFoundSvg },
  [Illustrations.CustomizeProfile]: { light: customizeProfileSvg, dark: customizeProfileSvg },
  [Illustrations.FilterEmpty]: { light: emptyFilterSvg, dark: emptyFilterSvg }
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
  style?: React.CSSProperties;
  className?: string;
}

const Illustration: FC<IllustrationProps> = ({ illustration, scale = 1, style, className }) => {
  const { theme } = useTheme();
  const IllustrationComp = IllustrationsSvgs[illustration][theme];

  return (
    <StyledIllustration className={className} scale={scale} style={style}>
      <IllustrationComp />
    </StyledIllustration>
  );
};

export default Illustration;
