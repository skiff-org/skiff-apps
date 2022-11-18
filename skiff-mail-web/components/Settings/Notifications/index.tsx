import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue, useToast } from 'skiff-front-utils';
import { UserFeature } from 'skiff-graphql';
import { GetUserTagsDocument, useSetNotificationPreferencesMutation } from 'skiff-mail-graphql';

import { useRequiredCurrentUserData } from '../../../apollo/currentUser';
import { useFeatureTag } from '../../../hooks/useUserTags';

export const useNotificationsSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();
  const { value: emailDisabled, loading: emailPrefLoading } = useFeatureTag(
    userID,
    UserFeature.EmailNotificationDisabled
  );
  const { value: inAppDisabled, loading: inAppPrefLoading } = useFeatureTag(
    userID,
    UserFeature.InAppNotificationDisabled
  );

  const { enqueueToast } = useToast();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!error) return;

    enqueueToast({
      body: 'Request failed, please try again.',
      icon: Icon.Warning
    });
  }, [enqueueToast, error]);

  const [setNotificationPreferences] = useSetNotificationPreferencesMutation({ onError: () => setError(true) });

  const updateNotificationPreferences = useCallback(
    (preferences: { inApp: boolean; email: boolean }) =>
      setNotificationPreferences({
        variables: { request: { email: preferences.email, inApp: preferences.inApp } },
        refetchQueries: [{ query: GetUserTagsDocument, variables: { request: { userID } } }]
      }),
    [setNotificationPreferences, userID]
  );

  const emailNotificationsEnabled = !emailDisabled;
  const inAppNotificationEnabled = !inAppDisabled;

  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Toggle,
        value: SettingValue.InAppNotifications,
        label: SETTINGS_LABELS[SettingValue.InAppNotifications],
        description: 'Enable/disable push notifications in-app.',
        icon: Icon.Bell,
        color: 'dark-blue',
        checked: inAppNotificationEnabled,
        onChange: () =>
          updateNotificationPreferences({ inApp: !inAppNotificationEnabled, email: emailNotificationsEnabled }),
        loading: inAppPrefLoading
      },
      {
        type: SettingType.Toggle,
        value: SettingValue.EmailNotifications,
        label: SETTINGS_LABELS[SettingValue.EmailNotifications],
        description: 'Enable/disable notifications sent via email.',
        icon: Icon.EnvelopeUnread,
        color: 'yellow',
        checked: emailNotificationsEnabled,
        onChange: () =>
          updateNotificationPreferences({ inApp: inAppNotificationEnabled, email: !emailNotificationsEnabled }),
        loading: emailPrefLoading
      }
    ],
    [
      emailNotificationsEnabled,
      emailPrefLoading,
      inAppNotificationEnabled,
      inAppPrefLoading,
      updateNotificationPreferences
    ]
  );
  return settings;
};
