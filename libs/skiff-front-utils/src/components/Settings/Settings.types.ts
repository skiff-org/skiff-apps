import { AccentColor, Icon } from '@skiff-org/skiff-ui';
import React, { ReactElement } from 'react';

export enum SettingsSection {
  General = 'General',
  SkiffMail = 'Mail',
  SkiffPages = 'Pages',
  SkiffCalendar = 'Calendar'
}

export enum TabPage {
  Empty = ' ',
  Account = 'account',
  Aliases = 'aliases',
  Appearance = 'appearance',
  AutoReply = 'auto-reply',
  Billing = 'billing',
  Credit = 'credits',
  CustomDomains = 'custom domains',
  Import = 'import',
  Notifications = 'notifications',
  Org = 'organization',
  Team = 'teams',
  Plans = 'plans',
  Security = 'security',
  Signature = 'signature',
  Storage = 'storage',
  Format = 'format',
  Contacts = 'contacts',
  Filters = 'filters'
}

export const SETTINGS_TABS_LABELS: Record<Exclude<TabPage, TabPage.Empty>, string> = {
  [TabPage.Account]: 'Account',
  [TabPage.Aliases]: 'Aliases',
  [TabPage.Appearance]: 'Appearance',
  [TabPage.AutoReply]: 'Auto reply',
  [TabPage.Billing]: 'Billing',
  [TabPage.Credit]: 'Credit',
  [TabPage.CustomDomains]: 'Custom domains',
  [TabPage.Import]: 'Import',
  [TabPage.Notifications]: 'Notifications',
  [TabPage.Org]: 'Organization',
  [TabPage.Team]: 'Teams',
  [TabPage.Plans]: 'Plans',
  [TabPage.Security]: 'Security',
  [TabPage.Signature]: 'Signature',
  [TabPage.Storage]: 'Storage',
  [TabPage.Format]: 'Format',
  [TabPage.Contacts]: 'Contacts',
  [TabPage.Filters]: 'Filters'
};

export enum SettingValue {
  EmptySetting = ' ',
  AccountRecovery = 'account-recovery',
  AddEmail = 'add-email',
  AddEmailAlias = 'add-email-alias',
  DefaultEmail = 'default-email',
  RecoveryEmail = 'recovery-email',
  AddWalletAlias = 'add-wallet-alias',
  DeleteRecoveryEmail = 'delete-recovery-email',
  ChangePassword = 'change-password',
  CreditManagement = 'credit-management',
  CryptoBanner = 'crypto-banner',
  CustomDomainSetup = 'custom-domain-setup',
  CustomDomainManage = 'custom-domain-manage',
  DateHourFormat = 'date-hour-format',
  DeleteAccount = 'delete-account',
  EditProfile = 'edit-profile',
  ENSAlias = 'ens-alias',
  LastVerifiedDate = 'last-verified-date',
  MailboxLayout = 'mailbox-layout',
  Notifications = 'notifications',
  SetupMFA = 'setup-mfa',
  SubscriptionPlans = 'subscription-plans',
  Theme = 'theme',
  VerificationPhrase = 'verification-phrase',
  Contacts = 'contacts',
  ContactsImport = 'contacts-import',
  ContactsAutoSync = 'auto-sync-contacts',
  PaymentDetails = 'payment-details',
  InvoiceHistory = 'invoice-history',
  CurrentSubscriptions = 'current-subscriptions',
  // Skiff mail
  AutoForwarding = 'auto-forwarding',
  AutoReply = 'auto-reply',
  EmailNotifications = 'email-notifications',
  PrivacyDigest = 'privacy-digest',
  ImportMail = 'import-mail',
  InAppNotifications = 'in-app-notifications',
  LoadRemoteContent = 'load-remote-content',
  SignatureManager = 'signature-manager',
  SwipeSettings = 'swipe-settings',
  AliasInboxes = 'alias-inboxes',
  Filters = 'filters',
  BrowserNotifications = 'web-push-notifications',
  // Skiff pages
  ImportFiles = 'import-files',
  OrganizationName = 'organization-name',
  OrganizationMemberList = 'organization-member-list',
  StorageManagement = 'storage-management',
  StorageFormat = 'storage-format',
  IconFormat = 'icon-format',
  StorageUsage = 'storage-usage',
  TeamList = 'team-list',
  Logout = 'logout',
  SecuredBySkiffSignature = 'secured-by-skiff-signature',
  // Skiff Calendar
  ImportCalendar = 'import-event',
  ImportGoogleCalendar = 'import-google-calendar',
  StartDayOfTheWeek = 'start-day-of-the-week',
  TimeZone = 'time-zone',
  DefaultColor = 'default-color'
}

export const SETTINGS_LABELS: Record<Exclude<SettingValue, SettingValue.EmptySetting>, string> = {
  [SettingValue.AccountRecovery]: 'Account recovery',
  [SettingValue.AddEmail]: 'Add recovery email',
  [SettingValue.AddEmailAlias]: 'Email aliases',
  [SettingValue.DefaultEmail]: 'Default email address',
  [SettingValue.RecoveryEmail]: 'Recovery email',
  [SettingValue.AddWalletAlias]: 'Wallet aliases',
  [SettingValue.DeleteRecoveryEmail]: 'Delete recovery email',
  [SettingValue.ChangePassword]: 'Change password',
  [SettingValue.CreditManagement]: 'Credit management',
  [SettingValue.CryptoBanner]: 'Crypto banner',
  [SettingValue.CustomDomainSetup]: 'Setup domain',
  [SettingValue.CustomDomainManage]: 'Manage domains',
  [SettingValue.DateHourFormat]: 'Date and hour format',
  [SettingValue.DeleteAccount]: 'Delete account',
  [SettingValue.EditProfile]: 'Edit profile',
  [SettingValue.ENSAlias]: 'ENS alias',
  [SettingValue.LastVerifiedDate]: 'Last verified date',
  [SettingValue.MailboxLayout]: 'Mailbox layout',
  [SettingValue.Notifications]: 'Notifications',
  [SettingValue.SetupMFA]: 'Two-factor authentication',
  [SettingValue.SubscriptionPlans]: 'Subscription plans',
  [SettingValue.Theme]: 'Theme',
  [SettingValue.VerificationPhrase]: 'View verification phrase',
  [SettingValue.Contacts]: 'Contacts',
  [SettingValue.ContactsImport]: 'Import contacts',
  [SettingValue.ContactsAutoSync]: 'Auto-sync contacts',
  [SettingValue.PaymentDetails]: 'Payment details',
  [SettingValue.InvoiceHistory]: 'Invoice history',
  [SettingValue.CurrentSubscriptions]: 'Current subscriptions',
  // Skiff mail
  [SettingValue.AutoForwarding]: 'Auto forwarding',
  [SettingValue.AutoReply]: 'Auto reply',
  [SettingValue.EmailNotifications]: 'Email comment notifications',
  [SettingValue.PrivacyDigest]: 'Privacy Digest newsletter',
  [SettingValue.ImportMail]: 'Import mail',
  [SettingValue.LoadRemoteContent]: 'Block remote content',
  [SettingValue.SignatureManager]: 'Signature manager',
  [SettingValue.AliasInboxes]: 'Alias inboxes',
  [SettingValue.Filters]: 'Filters',
  [SettingValue.BrowserNotifications]: 'Browser notifications',
  // Skiff pages
  [SettingValue.ImportFiles]: 'Import files',
  [SettingValue.OrganizationMemberList]: 'Member list',
  [SettingValue.TeamList]: 'Teams',
  [SettingValue.OrganizationName]: 'Organization name',
  [SettingValue.StorageManagement]: 'Storage management',
  [SettingValue.StorageFormat]: 'Storage format',
  [SettingValue.IconFormat]: 'Page icons',
  [SettingValue.StorageUsage]: 'Storage usage',
  [SettingValue.InAppNotifications]: 'In-app notifications',
  [SettingValue.Logout]: 'Logout',
  [SettingValue.SecuredBySkiffSignature]: 'Sign off with Skiff signature',
  [SettingValue.SwipeSettings]: 'Swipe settings',
  // Skiff calendar
  [SettingValue.ImportCalendar]: 'Import calendar',
  [SettingValue.ImportGoogleCalendar]: 'Import google calendar',
  [SettingValue.StartDayOfTheWeek]: 'Start week on',
  [SettingValue.TimeZone]: 'Time zone',
  [SettingValue.DefaultColor]: 'Default color'
};

/**
 * Sections
 * > Tabs
 * > > Settings
 *
 * === Example ===
 * General
 * > Appearance
 * > > Date format
 * > > Theme
 */

export type SettingsTab = {
  label: string;
  value: TabPage;
  icon: Icon;
  settings: Setting[];
  hideTab?: boolean;
};

export enum SettingType {
  Tab,
  Toggle,
  Custom,
  Action
}

interface BaseSetting {
  value: SettingValue;
  type: SettingType;
  label: string;
  icon: Icon;
  color: AccentColor;
  dataTest?: string;
}

export interface TabSetting extends BaseSetting {
  component: ReactElement;
  type: SettingType.Tab;
  description?: string;
}

export interface CustomSetting extends BaseSetting {
  component: ReactElement;
  type: SettingType.Custom;
  fullHeight?: boolean;
}

/**
 * This callback is being called when interacting with a toggle or action setting.
 * The `onSuccess` variable can be used to react to user decision, after a deferred action.
 * For example we can look on the logout setting action.
 * When pressing the logout setting, a prompt pops up and asks the user if he is sure he wants to leave.
 * At that point, if the user 'clicks' cancel, nothing will happen, however, if the user clicks 'logout', the `onSuccess`
 * function will be called and logout the user.
 */
type SettingsCallback = (onSuccess?: (() => void) | React.MouseEvent) => void;

export interface ToggleSetting extends BaseSetting {
  type: SettingType.Toggle;
  onChange: SettingsCallback;
  checked: boolean;
  loading?: boolean;
  description?: string;
  error?: boolean;
}

export interface ActionSetting extends BaseSetting {
  type: SettingType.Action;
  component?: ReactElement;
  onClick: SettingsCallback | React.MouseEventHandler;
}

export type Setting = ToggleSetting | TabSetting | ActionSetting | CustomSetting;

export type SettingIndices = {
  section?: SettingsSection;
  tab?: TabPage;
  setting?: SettingValue;
};

export const DEFAULT_WEB_SETTING_INDICES: Required<Pick<SettingIndices, 'section' | 'tab'>> & SettingIndices = {
  section: SettingsSection.General,
  tab: TabPage.Account
};

export const DEFAULT_MOBILE_SETTINGS_INDICES: SettingIndices = { tab: TabPage.Empty };

// TODO: Move all these into the QueryParam enum
export const TABS_QUERY_PARAM = 'settingTab';

export const SETTINGS_QUERY_PARAM = 'setting';

export interface BaseSettingsWithPayload {
  indices: SettingIndices;
  payload?: { [key: string]: unknown };
}

export interface ImportSettingsTabWithPayload extends BaseSettingsWithPayload {
  indices: SettingIndices & { tab: TabPage.Import };
  payload: {
    // must be defined if import intended
    destinationDoc?: string;
    applyToProsemirror?: boolean;
    drivePage?: boolean;
  };
}

export type SettingsPage =
  | {
      indices: SettingIndices;
      payload?: never;
    }
  | ImportSettingsTabWithPayload;
