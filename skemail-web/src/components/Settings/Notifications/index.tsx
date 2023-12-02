import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isBrowser } from 'react-device-detect';
import {
  CurrentUserSubscribedToPdDocument,
  GetUserTagsDocument,
  useBrowserPushNotificationsEnabledQuery,
  useCurrentUserSubscribedToPdQuery,
  useSetNotificationPreferencesMutation,
  useSetPdSubscribeFlagMutation,
  useUnsubscribeNotificationMutation
} from 'skiff-front-graphql';
import {
  SETTINGS_LABELS,
  Setting,
  SettingType,
  SettingValue,
  isReactNativeDesktopApp,
  isWindowsDesktopApp,
  useEnableMailPushNotifications,
  useFeatureTag,
  useRequiredCurrentUserData,
  useToast
} from 'skiff-front-utils';
import { UserFeature } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';

import client from '../../../apollo/client';

export const useNotificationsSettings: () => Setting[] = () => {
  const { userID } = useRequiredCurrentUserData();
  const { value: emailDisabled, loading: emailPrefLoading } = useFeatureTag(
    userID,
    UserFeature.EmailNotificationDisabled
  );

  const { enqueueToast } = useToast();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!error) return;

    enqueueToast({
      title: 'Could not update settings',
      body: 'Failed to change notification preference. Try again.'
    });
  }, [enqueueToast, error]);

  const [setNotificationPreferences] = useSetNotificationPreferencesMutation({ onError: () => setError(true) });
  const [setPDSubscribeFlag] = useSetPdSubscribeFlagMutation();
  const { data: subscribedToPdData, loading: subscribedLoading } = useCurrentUserSubscribedToPdQuery();
  const subscribedToPd = subscribedToPdData?.currentUser?.subscribedToPD ?? true;

  // web push
  const { enableNotifications } = useEnableMailPushNotifications({ client });
  const [unsubUser] = useUnsubscribeNotificationMutation();
  const { data: browserPushData, loading: browserPushLoading, refetch } = useBrowserPushNotificationsEnabledQuery();
  const browserPushEnabled = browserPushData?.browserPushNotificationsEnabled ?? false;

  const updateNotificationPreferences = useCallback(
    (preferences: { inApp: boolean; email: boolean }) =>
      setNotificationPreferences({
        variables: { request: { email: preferences.email, inApp: preferences.inApp } },
        refetchQueries: [{ query: GetUserTagsDocument, variables: { request: { userID } } }]
      }),
    [setNotificationPreferences, userID]
  );

  const updatePDSubscribeFlag = useCallback(
    (subscribed: boolean) => {
      void setPDSubscribeFlag({
        variables: {
          request: {
            subscribed
          }
        },
        refetchQueries: [{ query: CurrentUserSubscribedToPdDocument }]
      });
    },
    [setPDSubscribeFlag]
  );

  const emailNotificationsEnabled = !emailDisabled;

  const featureFlags = useFlags();
  const windowsNotificationTester = featureFlags.windowsNotificationTester as boolean;

  const settings = useMemo<Setting[]>(
    () => [
      ...insertIf<Setting>(
        (isBrowser && !isReactNativeDesktopApp() && !isWindowsDesktopApp()) || windowsNotificationTester,
        {
          type: SettingType.Toggle,
          value: SettingValue.BrowserNotifications,
          label: 'Browser notifications',
          icon: Icon.NotificationBadge,
          color: 'pink',
          checked: browserPushEnabled,
          onChange: () => {
            const runChange = async () => {
              if (browserPushEnabled) {
                console.log('Unsubscribing notifications');
                await unsubUser();
              } else {
                console.log('Enabling notifications');
                await enableNotifications();
              }
              await refetch();
            };
            void runChange();
          }
        }
      ),
      {
        type: SettingType.Toggle,
        value: SettingValue.EmailNotifications,
        label: SETTINGS_LABELS[SettingValue.EmailNotifications],
        icon: Icon.EnvelopeUnread,
        color: 'yellow',
        checked: emailNotificationsEnabled,
        onChange: () => void updateNotificationPreferences({ inApp: true, email: !emailNotificationsEnabled }),
        loading: emailPrefLoading
      },
      {
        type: SettingType.Toggle,
        value: SettingValue.PrivacyDigest,
        label: 'Privacy Digest newsletter',
        icon: Icon.Mailbox,
        color: 'blue',
        checked: subscribedToPd,
        onChange: () => void updatePDSubscribeFlag(!subscribedToPd),
        loading: subscribedLoading
      }
    ],
    [
      emailNotificationsEnabled,
      emailPrefLoading,
      browserPushLoading,
      updateNotificationPreferences,
      browserPushEnabled,
      subscribedLoading,
      subscribedToPd,
      updatePDSubscribeFlag
    ]
  );
  return settings;
};
