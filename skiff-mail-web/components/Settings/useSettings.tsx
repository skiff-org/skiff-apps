import { Icon } from 'nightwatch-ui';
import { useCallback, useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  SettingIndices,
  SettingsSection,
  SettingsTab,
  SETTINGS_TABS_LABELS,
  TabPage,
  TABS_QUERY_PARAM,
  SETTINGS_QUERY_PARAM
} from 'skiff-front-utils';
import { SystemLabels, PermissionLevel } from 'skiff-graphql';
import { useGetOrganizationQuery } from 'skiff-mail-graphql';
import { insertIf } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../apollo/currentUser';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailSettingsReducer } from '../../redux/reducers/settingsReducer';
import { getSearchParams, getSettingsParams, replaceURL, updateURL } from '../../utils/locationUtils';
import { useNavigate } from '../../utils/navigation';

import { useAccountSettings } from './Account';
import { useAliasesSettings } from './Alias';
import { useAppearanceSettings } from './Appearance';
import { autoReplySettings } from './AutoReply';
import { creditSettings } from './CreditManagement';
import { useCustomDomainsSettings } from './CustomDomains';
import { useImportSettings } from './Import';
import { useNotificationsSettings } from './Notifications';
import { usePlansSettings } from './Plans';
import { securitySettings } from './Security';
import { useSignatureSettings } from './SignatureManager';
export const TIMEOUT_DURATION = 250;
export const useSettings = () => {
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const querySearchParams = useAppSelector((state) => state.settings);

  const syncSearchStateAndQuery = useCallback(
    () => dispatch(skemailSettingsReducer.actions.setSettings(getSettingsParams())),
    [dispatch]
  );

  const openSettings = useCallback(
    ({ tab, setting }: Partial<SettingIndices>) => {
      const query = getSearchParams();
      if (tab) query[TABS_QUERY_PARAM] = tab;
      else delete query[TABS_QUERY_PARAM];
      if (setting) query[SETTINGS_QUERY_PARAM] = setting;
      else delete query[SETTINGS_QUERY_PARAM];

      // When redirecting from import action, should navigate back to inbox.
      if (window.location.pathname.includes('oauth')) {
        void navigateToSystemLabel(SystemLabels.Inbox, query);
      }
      updateURL(replaceURL({ query })); // Update url without re-rendering entire page
      syncSearchStateAndQuery(); // Sync search state with current query
    },
    [navigateToSystemLabel, syncSearchStateAndQuery]
  );

  const closeSettings = useCallback(() => {
    const query = getSearchParams();
    delete query[TABS_QUERY_PARAM];
    delete query[SETTINGS_QUERY_PARAM];
    // go back to the same location, with the same param (user label or thread id)
    updateURL(replaceURL({ query })); // Update url without re-rendering entire page
    syncSearchStateAndQuery(); // Sync search state with current query
  }, [syncSearchStateAndQuery]);

  const isSettingsOpen = !!querySearchParams[TABS_QUERY_PARAM];

  return {
    openSettings,
    closeSettings,
    querySearchParams,
    isSettingsOpen
  };
};

// this hook returns all the settings that the user can access and
// contains the logic for determining which setting tabs to show/hide
export const useAvailableSettings = () => {
  const aliasesSettings = useAliasesSettings();
  const importSettings = useImportSettings();
  const notificationsSettings = useNotificationsSettings();
  const accountSettings = useAccountSettings();
  const appearanceSettings = useAppearanceSettings();
  const planSettings = usePlansSettings();
  const signatureSettings = useSignatureSettings();

  const customDomainsSettings = useCustomDomainsSettings();

  const { rootOrgID } = useRequiredCurrentUserData();

  const { data: activeOrg, loading: activeOrgLoading } = useGetOrganizationQuery({
    variables: { id: rootOrgID }
  });

  const currentUserIsOrgAdmin =
    activeOrg?.organization.everyoneTeam.rootDocument?.currentUserPermissionLevel === PermissionLevel.Admin;

  const availableSettings: Record<
    Exclude<SettingsSection, SettingsSection.SkiffPages>,
    SettingsTab[]
  > = useMemo(() => {
    const settings = {
      [SettingsSection.General]: [
        ...insertIf(!isMobile, {
          label: SETTINGS_TABS_LABELS[TabPage.Account],
          value: TabPage.Account,
          icon: Icon.UserCircle,
          settings: accountSettings
        }),
        ...insertIf(!isMobile && currentUserIsOrgAdmin, {
          label: SETTINGS_TABS_LABELS[TabPage.Plans],
          value: TabPage.Plans,
          icon: Icon.Map,
          settings: planSettings
        }),
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
        }
      ],
      [SettingsSection.SkiffMail]: [
        {
          label: SETTINGS_TABS_LABELS[TabPage.CustomDomains],
          value: TabPage.CustomDomains,
          icon: Icon.AddressField,
          settings: customDomainsSettings
        },
        {
          label: SETTINGS_TABS_LABELS[TabPage.Import],
          value: TabPage.Import,
          icon: Icon.MoveMailbox,
          settings: importSettings
        },
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
    aliasesSettings,
    appearanceSettings,
    importSettings,
    notificationsSettings,
    planSettings,
    signatureSettings,
    currentUserIsOrgAdmin,
    customDomainsSettings
  ]);

  return { availableSettings, loading: activeOrgLoading };
};
