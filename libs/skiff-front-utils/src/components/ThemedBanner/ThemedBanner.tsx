import { Banner, BannerProps, ThemeMode } from '@skiff-org/skiff-ui';
import React from 'react';

import { useTheme } from '../../theme/AppThemeProvider';

const ThemedBanner = ({ ...bannerProps }: BannerProps) => {
  const { theme } = useTheme();
  const forceTheme = theme === ThemeMode.LIGHT ? ThemeMode.DARK : ThemeMode.LIGHT;
  return <Banner {...bannerProps} forceTheme={forceTheme} />;
};

export default ThemedBanner;
