import { useMemo } from 'react';
import { MobileView } from 'react-device-detect';
import { useLocation } from 'react-router-dom';
import { useUserProfile } from 'skiff-front-graphql';
import {
  MobileAvatarProps,
  SettingIndices,
  SettingsDrawer,
  SettingsModal,
  SettingsSection,
  SETTINGS_PAPER_ID,
  SETTINGS_QUERY_PARAM,
  TabPage,
  TABS_QUERY_PARAM,
  useTheme,
  useRequiredCurrentUserData,
  BrowserDesktopView
} from 'skiff-front-utils';

import { MOBILE_CALENDAR_LAYOUT_ID } from '../../constants/calendar.constants';
import { useUsernameFromUser } from '../../utils/hooks/useUsernameFromUser';

import { useCloseSettings, useOpenSettings } from './useOpenCloseSettings';
import { useAvailableSettings } from './useSettings';

const useQueryParam = (paramName: string) => {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  return query.get(paramName);
};

export const CalendarSettings = () => {
  const availableSettings = useAvailableSettings();

  const { theme } = useTheme();

  const openSettings = useOpenSettings();
  const closeSettings = useCloseSettings();

  const user = useRequiredCurrentUserData();
  const { username } = useUsernameFromUser(user);
  const { data: userProfileData } = useUserProfile(user.userID);
  const displayPictureData = userProfileData?.publicData.displayPictureData;
  const currentDisplayName = userProfileData?.publicData.displayName;

  const settingsTabValue = useQueryParam(TABS_QUERY_PARAM);
  const settingValue = useQueryParam(SETTINGS_QUERY_PARAM);
  const settingsIndices = useMemo(() => {
    // TODO: change to default when adding general section
    const defaultSettings = {
      section: SettingsSection.SkiffCalendar,
      tab: TabPage.Appearance
    };

    const settingFromQuery: SettingIndices = {};

    for (const [sectionIndex, section] of Object.values(availableSettings).entries()) {
      for (const [, tab] of section.entries()) {
        if (tab.value === settingsTabValue) {
          settingFromQuery.section = Object.keys(availableSettings)[sectionIndex] as SettingsSection;
          settingFromQuery.tab = tab.value;

          for (const [, setting] of tab.settings.entries()) {
            if (setting.value == settingValue) {
              settingFromQuery.setting = settingValue;
              break;
            }
          }
          return settingFromQuery;
        }
      }
    }

    return defaultSettings;
  }, [availableSettings, settingValue, settingsTabValue]);

  const mobileAvatarProps: MobileAvatarProps = {
    onCopy: () => {},
    displayName: currentDisplayName || '',
    theme,
    displayPictureData,
    userFullAddress: username,
    username,
    scrollContainerID: SETTINGS_PAPER_ID
  };

  return (
    <>
      <BrowserDesktopView>
        <SettingsModal
          initialIndices={settingsIndices}
          onChangeIndices={(indices: SettingIndices) => {
            openSettings({ indices });
          }}
          onClose={closeSettings}
          open={!!settingsTabValue}
          sections={availableSettings}
        />
      </BrowserDesktopView>
      <MobileView>
        <SettingsDrawer
          avatarProps={mobileAvatarProps}
          containerId={MOBILE_CALENDAR_LAYOUT_ID}
          initialSettingIndices={settingsIndices}
          onChangeSettingsIndices={(indices: SettingIndices) => {
            openSettings({ indices });
          }}
          onClose={closeSettings}
          open={!!settingsTabValue}
          sections={availableSettings}
        />
      </MobileView>
    </>
  );
};
