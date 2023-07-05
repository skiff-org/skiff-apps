import { useFlags } from 'launchdarkly-react-client-sdk';
import { Icon } from '@skiff-org/skiff-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useGetOrganizationQuery, useSubscriptionPlan } from 'skiff-front-graphql';
import {
  SETTINGS_TABS_LABELS,
  SettingsSection,
  SettingsTab,
  TabPage,
  getEnvironment,
  getOrganizationSettings,
  isMobileApp,
  useBillingSettings,
  useContactsSettings,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { PermissionLevel, SubscriptionPlan } from 'skiff-graphql';
import { AutoForwardingFlag, MailFilteringFeatureFlag, insertIf } from 'skiff-utils';

import client from '../../apollo/client';

import { useAccountSettings } from './Account';
import { useAliasesSettings } from './Alias';
import { useAppearanceSettings } from './Appearance';
import { autoReplySettings } from './AutoReply';
import { creditSettings } from './CreditManagement';
import { useCustomDomainsSettings } from './CustomDomains';
import { useFiltersSettings } from './Filters';
import { useForwardingSettings } from './Forwarding';
import { useImportSettings } from './Import';
import { useNotificationsSettings } from './Notifications';
import { usePlansSettings } from './Plans';
import { useSecuritySettings } from './Security';
import { useSignatureSettings } from './SignatureManager';
import { useSettings } from './useSettings';

// this hook returns all the settings that the user can access and
// contains the logic for determining which setting tabs to show/hide
export const useAvailableSettings = () => {
  const { openSettings } = useSettings();
  const openPlansPage = () => openSettings({ tab: TabPage.Plans });
  const aliasesSettings = useAliasesSettings();
  const importSettings = useImportSettings();
  const forwardingSettings = useForwardingSettings();
  const notificationsSettings = useNotificationsSettings();
  const accountSettings = useAccountSettings();
  const appearanceSettings = useAppearanceSettings();
  const plansSettings = usePlansSettings();
  const billingSettings = useBillingSettings(openPlansPage);
  const signatureSettings = useSignatureSettings();
  const securitySettings = useSecuritySettings();
  const filtersSettings = useFiltersSettings();

  const featureFlags = useFlags();
  const billingFF = featureFlags.billingTab as boolean;
  const showBilling = ['local'].includes(getEnvironment(new URL(window.location.origin))) || billingFF;

  const {
    data: { activeSubscription },
    loading: subscriptionLoading
  } = useSubscriptionPlan();

  const customDomainsSettings = useCustomDomainsSettings();

  const { rootOrgID } = useRequiredCurrentUserData();

  const { data: activeOrg, loading: activeOrgLoading } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });

  const organizationSettings = getOrganizationSettings({
    client,
    openSettings: ({ indices }) => openSettings(indices)
  });

  const contactsSettings = useContactsSettings();

  const flags = useFlags();
  const env = getEnvironment(new URL(window.location.origin));
  const hasMailFilteringFeatureFlag =
    env === 'local' || env === 'vercel' || (flags.mailFiltering as MailFilteringFeatureFlag);
  const hasAutoForwardingFlag = env === 'local' || env === 'vercel' || (flags.autoForwarding as AutoForwardingFlag);

  const currentUserIsOrgAdmin =
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;

  const availableSettings: Record<
    Exclude<SettingsSection, SettingsSection.SkiffPages | SettingsSection.SkiffCalendar>,
    SettingsTab[]
  > = useMemo(() => {
    const settings = {
      [SettingsSection.General]: [
        ...insertIf(!isMobile, {
          label: SETTINGS_TABS_LABELS[TabPage.Account],
          value: TabPage.Account,
          icon: Icon.UserCircle,
          settings: accountSettings,
          hideTab: true
        }),
        {
          label: SETTINGS_TABS_LABELS[TabPage.Org],
          value: TabPage.Org,
          icon: Icon.OrgStructure,
          settings: organizationSettings
        },
        ...insertIf(!isMobileApp() && currentUserIsOrgAdmin, {
          label: SETTINGS_TABS_LABELS[TabPage.Plans],
          value: TabPage.Plans,
          icon: Icon.Map,
          settings: plansSettings
        }),
        ...insertIf(
          showBilling &&
            !isMobileApp() &&
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
          label: SETTINGS_TABS_LABELS[TabPage.Appearance],
          value: TabPage.Appearance,
          icon: Icon.Sun,
          settings: appearanceSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Aliases],
          value: TabPage.Aliases,
          icon: Icon.At,
          settings: aliasesSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Security],
          value: TabPage.Security,
          icon: Icon.Lock,
          settings: securitySettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Credit],
          value: TabPage.Credit,
          icon: Icon.Trophy,
          settings: creditSettings
        },
        {
          icon: Icon.UserCircle,
          label: SETTINGS_TABS_LABELS[TabPage.Contacts],
          value: TabPage.Contacts,
          settings: contactsSettings
        }
      ],
      [SettingsSection.SkiffMail]: [
        ...insertIf(currentUserIsOrgAdmin, {
          label: SETTINGS_TABS_LABELS[TabPage.CustomDomains],
          value: TabPage.CustomDomains,
          icon: Icon.AddressField,
          settings: customDomainsSettings
        }),
        {
          label: SETTINGS_TABS_LABELS[TabPage.Import],
          value: TabPage.Import,
          icon: Icon.MoveMailbox,
          settings: importSettings
        },
        ...insertIf(hasAutoForwardingFlag, {
          label: SETTINGS_TABS_LABELS[TabPage.Forwarding],
          value: TabPage.Forwarding,
          icon: Icon.ForwardEmail,
          settings: forwardingSettings
        }),
        ...insertIf(hasMailFilteringFeatureFlag, {
          label: SETTINGS_TABS_LABELS[TabPage.Filters],
          value: TabPage.Filters,
          icon: Icon.Filter,
          settings: filtersSettings
        }),
        {
          label: SETTINGS_TABS_LABELS[TabPage.Notifications],
          value: TabPage.Notifications,
          icon: Icon.Bell,
          settings: notificationsSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Signature],
          value: TabPage.Signature,
          icon: Icon.Edit,
          settings: signatureSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.AutoReply],
          value: TabPage.AutoReply,
          icon: Icon.Reply,
          settings: autoReplySettings
        },
        ...insertIf(isMobile, {
          label: SETTINGS_TABS_LABELS[TabPage.Account],
          value: TabPage.Account,
          icon: Icon.UserCircle,
          settings: accountSettings
        })
      ]
    };

    return settings;
  }, [
    accountSettings,
    organizationSettings,
    currentUserIsOrgAdmin,
    plansSettings,
    billingSettings,
    appearanceSettings,
    aliasesSettings,
    securitySettings,
    contactsSettings,
    customDomainsSettings,
    importSettings,
    notificationsSettings,
    signatureSettings,
    hasMailFilteringFeatureFlag,
    filtersSettings,
    activeSubscription,
    showBilling,
    subscriptionLoading
  ]);

  return { availableSettings, loading: activeOrgLoading };
};
