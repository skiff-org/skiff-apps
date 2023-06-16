import { Icon, Icons, Size, ThemeMode, Typography, TypographySize } from 'nightwatch-ui';
import React, { useState } from 'react';
import { ProductApp } from 'skiff-graphql';

import { useToast } from '../../hooks';

import { AppItem } from './AppItem';
import { AppButtons, AppIconInfo, AppSectionContainer, NameSection, SKIFF_APPS } from './OrganizationSelect.constants';

interface AppSectionProps {
  activeApp: ProductApp;
  closeDropdown: () => void;
  label?: string;
  username: string;
  numUnread?: number;
  // override onClick for onboard dummy app demo
  customOnClicks?: Record<ProductApp, () => void>;
  storeWorkspaceEvent?: () => void;
}

export const AppSection = (props: AppSectionProps) => {
  const { activeApp, closeDropdown, customOnClicks, label, numUnread, storeWorkspaceEvent, username } = props;
  const { enqueueToast } = useToast();
  const [nameHover, setNameHover] = useState(false);
  const copyToClipboard = (textToCopy: string) => {
    void navigator.clipboard.writeText(textToCopy);
    enqueueToast({
      title: 'Email alias copied',
      body: `${textToCopy} is now in your clipboard.`
    });
  };

  return (
    <AppSectionContainer>
      <NameSection
        $disabled={!!customOnClicks}
        onClick={() => (customOnClicks ? {} : copyToClipboard(username))}
        onMouseEnter={() => setNameHover(true)}
        onMouseLeave={() => setNameHover(false)}
      >
        <Typography
          color={nameHover && !customOnClicks ? 'primary' : 'secondary'}
          forceTheme={ThemeMode.DARK}
          size={TypographySize.SMALL}
        >
          {label}
        </Typography>
        <Icons
          color={nameHover && !customOnClicks ? 'primary' : 'secondary'}
          forceTheme={ThemeMode.DARK}
          icon={Icon.Copy}
          size={Size.SMALL}
        />
      </NameSection>
      <AppButtons>
        {Object.values(SKIFF_APPS).map((app: AppIconInfo) => {
          return (
            <AppItem
              activeApp={activeApp}
              app={app}
              closeDropdown={closeDropdown}
              customOnClick={customOnClicks?.[activeApp]}
              key={app.label}
              numUnread={numUnread}
              storeWorkspaceEvent={storeWorkspaceEvent}
            />
          );
        })}
      </AppButtons>
    </AppSectionContainer>
  );
};
