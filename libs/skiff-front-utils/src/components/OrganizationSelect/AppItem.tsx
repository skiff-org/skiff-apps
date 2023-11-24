import { ThemeMode, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { useState } from 'react';
import { ProductApp } from 'skiff-graphql';

import { AppContainer, AppIcon, AppIconInfo, AppShadow, Badge, BadgeContainer } from './OrganizationSelect.constants';

interface AppItemProps {
  activeApp: ProductApp;
  app: AppIconInfo;
  closeDropdown: () => void;
  numUnread?: number;
  customOnClick?: () => void;
  storeWorkspaceEvent?: () => void;
}

const getBadgeOffset = (chars?: string) => {
  if (!chars) return 0;
  switch (chars.length) {
    case 1:
      return 14;
    case 2:
      return 12;
    case 3:
      return 0;
    default:
      return 14;
  }
};

export const AppItem = (props: AppItemProps) => {
  const { activeApp, closeDropdown, customOnClick, storeWorkspaceEvent, app, numUnread } = props;

  const unreadLabel = !!numUnread && numUnread > 99 ? '99+' : `${numUnread || ''}`;
  const offset = getBadgeOffset(unreadLabel);

  const active = activeApp.toLowerCase() === app.label.toLowerCase();
  const [hover, setHover] = useState(false);
  const onClick = () => {
    if (customOnClick) {
      customOnClick();
      return;
    }
    if (active) return;
    app.onClick();
    if (!storeWorkspaceEvent) return;
    storeWorkspaceEvent();
    closeDropdown();
  };
  return (
    <AppContainer
      $active={active}
      key={app.label}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {!!numUnread && app.productApp === ProductApp.Mail && (
        <BadgeContainer $offset={offset}>
          <Badge>
            <Typography color='white' size={TypographySize.CAPTION} weight={TypographyWeight.MEDIUM}>
              {unreadLabel}
            </Typography>
          </Badge>
        </BadgeContainer>
      )}
      <AppShadow>
        <AppIcon $active={active} $inSwitcher height='54px' src={app.icon} width='54px' />
      </AppShadow>
      <Typography
        color={active || hover ? 'primary' : 'secondary'}
        forceTheme={ThemeMode.DARK}
        size={TypographySize.SMALL}
      >
        {app.label}
      </Typography>
    </AppContainer>
  );
};
