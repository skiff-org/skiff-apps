import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useUserProfile } from 'skiff-front-graphql';
import {
  DEFAULT_MOBILE_SETTINGS_INDICES,
  DEFAULT_WEB_SETTING_INDICES,
  MobileAvatarProps,
  SettingIndices,
  SettingsDrawer,
  SettingsModal,
  SettingsSection,
  SETTINGS_PAPER_ID,
  useTheme,
  useToast,
  useRequiredCurrentUserData
} from 'skiff-front-utils';

import { MOBILE_MAIL_BODY_ID } from '../../constants/mailbox.constants';
import { useCurrentUserDefinedDisplayName } from '../../hooks/useCurrentUserDefinedDisplayName';
import { useUsernameFromUser } from '../../hooks/useUsernameFromUser';

import { useAvailableSettings } from './useAvailableSettings';
import { useSettings } from './useSettings';

export default function Settings() {
  const { availableSettings, loading } = useAvailableSettings();
  const { enqueueToast } = useToast();
  const { closeSettings, openSettings, querySearchParams } = useSettings();
  const { settingTab: settingsTabValue, setting: settingValue, fullsize } = querySearchParams;
  const user = useRequiredCurrentUserData();
  const currentDisplayName = useCurrentUserDefinedDisplayName();
  const { username } = useUsernameFromUser(user);
  const { data: userProfileData } = useUserProfile(user.userID);
  const displayPictureData = userProfileData?.publicData.displayPictureData;
  const { theme } = useTheme();

  const settingsIndices: SettingIndices = useMemo(() => {
    const defaultSettings = isMobile ? DEFAULT_MOBILE_SETTINGS_INDICES : DEFAULT_WEB_SETTING_INDICES;
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
    onCopy: () => {
      enqueueToast({
        title: `Username copied`,
        body: `${username} saved to clipboard.`
      });
    },
    displayName: currentDisplayName || '',
    theme,
    displayPictureData,
    userFullAddress: username,
    username: username,
    scrollContainerID: SETTINGS_PAPER_ID
  };

  if (loading) {
    return null;
  }

  return isMobile ? (
    <SettingsDrawer
      avatarProps={mobileAvatarProps}
      containerId={MOBILE_MAIL_BODY_ID}
      fullsize={!!fullsize}
      initialSettingIndices={settingsIndices}
      onChangeSettingsIndices={openSettings}
      onClose={closeSettings}
      open={!!settingsTabValue}
      sections={availableSettings}
    />
  ) : (
    <SettingsModal
      initialIndices={settingsIndices}
      onChangeIndices={openSettings}
      onClose={closeSettings}
      open={!!settingsTabValue}
      sections={availableSettings}
    />
  );
}
