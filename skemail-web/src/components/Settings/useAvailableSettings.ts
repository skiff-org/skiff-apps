import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetOrganizationQuery, useSubscriptionPlan } from 'skiff-front-graphql';
import {
  SETTINGS_TABS_LABELS,
  SettingsPage,
  SettingsSection,
  SettingsTab,
  TabPage,
  getOrganizationSettings,
  isMobileApp,
  isReactNativeDesktopApp,
  useAliasesSettings,
  useBillingSettings,
  useContactsSettings, useRequiredCurrentUserData
} from 'skiff-front-utils';
import { PermissionLevel, SubscriptionPlan } from 'skiff-graphql';
import { PaywallErrorCode, insertIf } from 'skiff-utils';

import client from '../../apollo/client';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';

import { ModalType } from '../../redux/reducers/modalTypes';
import { useAccountSettings } from './Account';
import { useAppearanceSettings } from './Appearance';
import { creditSettings } from './CreditManagement';
import { useCustomDomainsSettings } from './CustomDomains';
import { useFiltersSettings } from './Filters';
import { useForwardingSettings } from './Forwarding';
import { useImportSettings } from './Import';
import { useInboxSettings } from './Inbox';
import { useNotificationsSettings } from './Notifications';
import { usePlansSettings } from './Plans';
import { useQuickAliasSettings } from './QuickAlias';
import { autoReplySettings } from './Response';
import { useSecuritySettings } from './Security';
import { useSignatureSettings } from './SignatureManager';
import { useSilenceSettings } from './Silence';
import { useStorageSettings } from './Storage/Storage';
import { useSettings } from './useSettings';

// this hook returns all the settings that the user can access and
// contains the logic for determining which setting tabs to show/hide
export const useAvailableSettings = () => {
  const { openSettings } = useSettings();
  const dispatch = useDispatch();
  const openPaywallModal = (paywallErrorCode: PaywallErrorCode) =>
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.Paywall,
        paywallErrorCode
      })
    );

  const openSettingsPage = (page: SettingsPage) => openSettings(page.indices);
  const openPlansPage = () => openSettings({ tab: TabPage.Plans });
  const aliasesSettings = useAliasesSettings({
    client,
    openSettings: openSettingsPage,
    openPaywallModal
  }
  );
  const importSettings = useImportSettings();
  const inboxSettings = useInboxSettings();
  const forwardingSettings = useForwardingSettings();
  const notificationsSettings = useNotificationsSettings();
  const accountSettings = useAccountSettings();
  const appearanceSettings = useAppearanceSettings();
  const plansSettings = usePlansSettings();
  const billingSettings = useBillingSettings(openPlansPage);
  const securitySettings = useSecuritySettings();
  const filtersSettings = useFiltersSettings();
  const signatureSettings = useSignatureSettings();
  const silenceSettings = useSilenceSettings();
  const storageSettings = useStorageSettings();
  const quickAliasSettings = useQuickAliasSettings();

  const { populateContactContent, selectedContact } = useAppSelector((state) => state.modal);

  const clearPopulateContactContent = () => {
    dispatch(skemailModalReducer.actions.clearPopulateContactContent());
    dispatch(skemailModalReducer.actions.clearSelectedContact());
  };

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

  // add new contacts arg
  const contactsSettings = useContactsSettings(populateContactContent, clearPopulateContactContent, selectedContact);
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
          label: SETTINGS_TABS_LABELS[TabPage.Appearance],
          value: TabPage.Appearance,
          icon: Icon.Sun,
          settings: appearanceSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Addresses],
          value: TabPage.Addresses,
          icon: Icon.At,
          settings: aliasesSettings
        },
        ...insertIf(!isMobile, {
          label: SETTINGS_TABS_LABELS[TabPage.QuickAliases],
          value: TabPage.QuickAliases,
          icon: Icon.Bolt,
          settings: quickAliasSettings
        }),
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
        },
        {
          icon: Icon.Server,
          label: SETTINGS_TABS_LABELS[TabPage.Storage],
          value: TabPage.Storage,
          settings: storageSettings ?? []
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
        {
          label: SETTINGS_TABS_LABELS[TabPage.Forwarding],
          value: TabPage.Forwarding,
          icon: Icon.ForwardEmail,
          settings: forwardingSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Filters],
          value: TabPage.Filters,
          icon: Icon.Filter,
          settings: filtersSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Inbox],
          value: TabPage.Inbox,
          icon: Icon.Mailbox,
          settings: inboxSettings
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
        {
          label: SETTINGS_TABS_LABELS[TabPage.Notifications],
          value: TabPage.Notifications,
          icon: Icon.Bell,
          settings: notificationsSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Silence],
          value: TabPage.Silence,
          icon: Icon.SoundSlash,
          settings: silenceSettings
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
    subscriptionLoading,
    activeSubscription,
    billingSettings,
    appearanceSettings,
    aliasesSettings,
    securitySettings,
    contactsSettings,
    customDomainsSettings,
    importSettings,
    forwardingSettings,
    filtersSettings,
    inboxSettings,
    signatureSettings,
    notificationsSettings
  ]);

  return { availableSettings, loading: activeOrgLoading };
};
