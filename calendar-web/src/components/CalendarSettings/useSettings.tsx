import { Icon } from 'nightwatch-ui';
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSubscriptionPlan } from 'skiff-front-graphql';
import {
  SETTINGS_TABS_LABELS,
  SettingsPage,
  SettingsSection,
  SettingsTab,
  TabPage,
  getOrganizationSettings,
  isMobileApp,
  isReactNativeDesktopApp,
  useBillingSettings,
  useContactsSettings,
  useCurrentOrganization
} from 'skiff-front-utils';
import { SubscriptionPlan } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';

import { PermissionLevel } from '../../../generated/graphql';
import client from '../../apollo/client';

import { useAccountSettings } from './Account';
import { useAppearanceSettings } from './Appearance';
import { useFormatSettings } from './Format';
import { useImportSettings } from './Import';
import { usePlansSettings } from './Plans';
import { useOpenSettings } from './useOpenCloseSettings';

export const useSettingsState = () => {
  const location = useLocation();
  return location.state as SettingsPage;
};

// this hook returns all the settings that the user can access and
// contains the logic for determining which setting tabs to show/hide
export const useAvailableSettings = () => {
  const importSettings = useImportSettings();
  const appearanceSettings = useAppearanceSettings();
  const formatSettings = useFormatSettings();
  const accountSettings = useAccountSettings();

  const openSettings = useOpenSettings();

  const contactsSettings = useContactsSettings();

  const organizationSettings = getOrganizationSettings({
    client,
    openSettings
  });
  const { data: activeOrg } = useCurrentOrganization();
  const currentUserIsOrgAdmin =
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;
  const plansSettings = usePlansSettings();
  const openPlansPage = () => openSettings({ indices: { tab: TabPage.Plans } });
  const billingSettings = useBillingSettings(openPlansPage);
  const {
    data: { activeSubscription },
    loading: subscriptionLoading
  } = useSubscriptionPlan();

  const availableSettings = React.useMemo(() => {
    const settings: Record<
      Exclude<SettingsSection, SettingsSection.SkiffMail | SettingsSection.SkiffPages>,
      SettingsTab[]
    > = {
      [SettingsSection.General]: [
        {
          label: SETTINGS_TABS_LABELS[TabPage.Org],
          value: TabPage.Org,
          icon: Icon.OrgStructure,
          settings: organizationSettings
        },
        ...insertIf(!isMobileApp() && !isReactNativeDesktopApp() && currentUserIsOrgAdmin, {
          label: SETTINGS_TABS_LABELS[TabPage.Plans],
          value: TabPage.Plans,
          icon: Icon.Map,
          settings: plansSettings
        }),
        ...insertIf(
          !isMobileApp() &&
            !isReactNativeDesktopApp() &&
            currentUserIsOrgAdmin &&
            !subscriptionLoading &&
            activeSubscription !== SubscriptionPlan.Free,
          {
            label: SETTINGS_TABS_LABELS[TabPage.Billing],
            value: TabPage.Billing,
            icon: Icon.Currency,
            settings: billingSettings
          }
        ),
        {
          icon: Icon.UserCircle,
          label: SETTINGS_TABS_LABELS[TabPage.Contacts],
          value: TabPage.Contacts,
          settings: contactsSettings
        }
      ],
      [SettingsSection.SkiffCalendar]: [
        {
          label: SETTINGS_TABS_LABELS[TabPage.Appearance],
          value: TabPage.Appearance,
          icon: Icon.Sun,
          settings: appearanceSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Import],
          value: TabPage.Import,
          icon: Icon.Upload,
          settings: importSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Format],
          value: TabPage.Format,
          icon: Icon.Calendar,
          settings: formatSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Account],
          value: TabPage.Account,
          icon: Icon.UserCircle,
          settings: accountSettings,
          hideTab: true
        }
      ]
    };

    return settings;
  }, [importSettings, appearanceSettings, formatSettings, accountSettings, organizationSettings, contactsSettings]);

  return availableSettings;
};
