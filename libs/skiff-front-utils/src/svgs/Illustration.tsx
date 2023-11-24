import { ThemeMode } from 'nightwatch-ui';
import { lazy, Suspense } from 'react';
import styled from 'styled-components';

import { useTheme } from '../theme/AppThemeProvider';

const bitcoinSymbolSvg = lazy(() => import('./svgs/bitcoin-symbol.svg'));
const customizeProfileSvg = lazy(() => import('./svgs/customize-profile.svg'));
const darkMigrateCalSvg = lazy(() => import('./svgs/dark-cal-migrate.svg'));
const darkMigrateMailSvg = lazy(() => import('./svgs/dark-mail-migrate.svg'));
const darkModeSvg = lazy(() => import('./svgs/dark-mode.svg'));
const emptyFilterSvg = lazy(() => import('./svgs/empty-filter.svg'));
const EnableNotificationsSvg = lazy(() => import('./svgs/enable-notifications.svg'));
const ethSymbolSvg = lazy(() => import('./svgs/eth-symbol.svg'));
const IPFSHeaderSvg = lazy(() => import('./svgs/IPFS-header.svg'));
const lightMigrateCalSvg = lazy(() => import('./svgs/light-cal-migrate.svg'));
const lightMigrateMailSvg = lazy(() => import('./svgs/light-mail-migrate.svg'));
const lightModeSvg = lazy(() => import('./svgs/light-mode.svg'));
const loadingSkiffLogoDarkSvg = lazy(() => import('./svgs/loading-skiff-logo-dark.svg'));
const loadingSkiffLogoLightSvg = lazy(() => import('./svgs/loading-skiff-logo-light.svg'));
const noResultsFoundSvg = lazy(() => import('./svgs/no-results-found.svg'));
const ServerHeaderSvg = lazy(() => import('./svgs/server-header.svg'));
const skiffLogoDarkSvg = lazy(() => import('./svgs/skiff-logo-dark-inset.svg'));
const skiffLogoLightSvg = lazy(() => import('./svgs/skiff-logo-light-inset.svg'));
const systemModeSelectSvg = lazy(() => import('./svgs/system-mode.svg'));
const USDCSymbolSvg = lazy(() => import('./svgs/usdc-symbol.svg'));
const EmptyTrashSvg = lazy(() => import('./svgs/empty-trash.svg'));
const openEnvelopeSvg = lazy(() => import('./svgs/open-envelope.svg'));
const importMailSvg = lazy(() => import('./svgs/import-mail.svg'));
const introFreeCustomDomainSvg = lazy(() => import('./svgs/intro-free-custom-domain.svg'));
const whaleSvg = lazy(() => import('./svgs/whale.svg'));
const lightQuickAliasesEnvelope = lazy(() => import('./svgs/quick-aliases-envelope-light.svg'));

export enum Illustrations {
  bitcoinSymbol,
  ethSymbol,
  USDCSymbol,
  LoadingSkiffLogo,
  EnableNotifications,
  DarkMode,
  LightMode,
  SystemMode,
  IPFSHeader,
  ServerHeader,
  MigrateCal,
  MigrateMail,
  SkiffLockupIcon,
  NoResultsFound,
  CustomizeProfile,
  FilterEmpty,
  EmptyTrash,
  OpenEnvelope,
  ImportMail,
  IntroFreeCustomDomain,
  Whale,
  QuickAliasesEnvelope
}

const IllustrationsSvgs = {
  [Illustrations.ethSymbol]: { light: ethSymbolSvg, dark: ethSymbolSvg },
  [Illustrations.bitcoinSymbol]: { light: bitcoinSymbolSvg, dark: bitcoinSymbolSvg },
  [Illustrations.EmptyTrash]: { light: EmptyTrashSvg, dark: EmptyTrashSvg },
  [Illustrations.USDCSymbol]: { light: USDCSymbolSvg, dark: USDCSymbolSvg },
  [Illustrations.LoadingSkiffLogo]: { light: loadingSkiffLogoLightSvg, dark: loadingSkiffLogoDarkSvg },
  [Illustrations.EnableNotifications]: { light: EnableNotificationsSvg, dark: EnableNotificationsSvg },
  [Illustrations.DarkMode]: { light: darkModeSvg, dark: darkModeSvg },
  [Illustrations.LightMode]: { light: lightModeSvg, dark: lightModeSvg },
  [Illustrations.SystemMode]: { light: systemModeSelectSvg, dark: systemModeSelectSvg },
  [Illustrations.IPFSHeader]: { light: IPFSHeaderSvg, dark: IPFSHeaderSvg },
  [Illustrations.ServerHeader]: { light: ServerHeaderSvg, dark: ServerHeaderSvg },
  [Illustrations.MigrateCal]: { light: lightMigrateCalSvg, dark: darkMigrateCalSvg },
  [Illustrations.MigrateMail]: { light: lightMigrateMailSvg, dark: darkMigrateMailSvg },
  [Illustrations.SkiffLockupIcon]: { light: skiffLogoLightSvg, dark: skiffLogoDarkSvg },
  [Illustrations.NoResultsFound]: { light: noResultsFoundSvg, dark: noResultsFoundSvg },
  [Illustrations.CustomizeProfile]: { light: customizeProfileSvg, dark: customizeProfileSvg },
  [Illustrations.FilterEmpty]: { light: emptyFilterSvg, dark: emptyFilterSvg },
  [Illustrations.OpenEnvelope]: { light: openEnvelopeSvg, dark: openEnvelopeSvg },
  [Illustrations.ImportMail]: { light: importMailSvg, dark: importMailSvg },
  [Illustrations.IntroFreeCustomDomain]: { light: introFreeCustomDomainSvg, dark: introFreeCustomDomainSvg },
  [Illustrations.Whale]: { light: whaleSvg, dark: whaleSvg },
  //TODO: add dark mode svg
  [Illustrations.QuickAliasesEnvelope]: { light: lightQuickAliasesEnvelope, dark: lightQuickAliasesEnvelope }
};

const StyledIllustration = styled.span<{ scale: number; includeBorderRadius?: boolean }>`
  display: inline-flex;
  transform: ${(props) => `scale(${props.scale})`};
  svg {
    width: unset;
    border-radius: ${(props) => (props.includeBorderRadius ? '4' : '0')}px;
  }
`;

export interface IllustrationProps {
  illustration: Illustrations;
  forceTheme?: ThemeMode;
  scale?: number;
  style?: React.CSSProperties;
  includeBorderRadius?: boolean;
}

const Illustration = ({ illustration, scale = 1, style, forceTheme, includeBorderRadius }: IllustrationProps) => {
  const { theme } = useTheme();
  const IllustrationComp = IllustrationsSvgs[illustration][forceTheme || theme];

  return (
    <StyledIllustration includeBorderRadius={includeBorderRadius} scale={scale} style={style}>
      <Suspense fallback={<></>}>
        <IllustrationComp />
      </Suspense>
    </StyledIllustration>
  );
};

export default Illustration;
