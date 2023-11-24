import { AccentColor, Icon } from 'nightwatch-ui';
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
  Addresses = 'addresses',
  Appearance = 'appearance',
  AutoReply = 'auto-reply',
  Billing = 'billing',
  Credit = 'credits',
  CustomDomains = 'custom domains',
  Import = 'import',
  Inbox = 'inbox',
  Forwarding = 'forwarding',
  Notifications = 'notifications',
  Org = 'organization',
  Team = 'teams',
  Plans = 'plans',
  Responses = 'responses',
  Security = 'security',
  Signature = 'signature',
  Silence = 'silence',
  Storage = 'storage',
  Format = 'format',
  Contacts = 'contacts',
  Filters = 'filters',
  QuickAliases = 'quick aliases'
}

export const SETTINGS_TABS_LABELS: Record<Exclude<TabPage, TabPage.Empty>, string> = {
  [TabPage.Account]: 'Account',
  [TabPage.Addresses]: 'Addresses',
  [TabPage.Appearance]: 'Appearance',
  [TabPage.AutoReply]: 'Auto reply',
  [TabPage.Billing]: 'Billing',
  [TabPage.CustomDomains]: 'Custom domains',
  [TabPage.Import]: 'Import',
  [TabPage.Inbox]: 'Inbox',
  [TabPage.Forwarding]: 'Forwarding',
  [TabPage.Notifications]: 'Notifications',
  [TabPage.Org]: 'Organization',
  [TabPage.Team]: 'Teams',
  [TabPage.Plans]: 'Plans',
  [TabPage.Responses]: 'Compose & reply',
  [TabPage.QuickAliases]: 'Quick Aliases',
  [TabPage.Silence]: 'Noise canceling',
  [TabPage.Security]: 'Security',
  [TabPage.Signature]: 'Signature',
  [TabPage.Credit]: 'Credits',
  [TabPage.Storage]: 'Storage',
  [TabPage.Format]: 'Format',
  [TabPage.Contacts]: 'Contacts',
  [TabPage.Filters]: 'Filters & spam'
};

export enum SettingValue {
  EmptySetting = ' ',
  AccountRecovery = 'account-recovery',
  AddEmail = 'add-email',
  AddEmailAlias = 'add-email-alias',
  AutoAdvance = 'auto-advance',
  AliasTagList = 'alias-tag-list',
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
  ContactsDeviceSync = 'device-sync-contacts',
  PaymentDetails = 'payment-details',
  InvoiceHistory = 'invoice-history',
  CurrentSubscriptions = 'current-subscriptions',
  QuickAlias = 'quick-alias',
  QuickAliasSubdomain = 'quick-alias-subdomain',
  QuickAliasBanner = 'quick-alias-banner',
  PgpKeys = 'pgp-keys',
  AttachPgp = 'attach-pgp',
  // Skiff mail
  AutoForwarding = 'auto-forwarding',
  AutoReply = 'auto-reply',
  EmailNotifications = 'email-notifications',
  PrivacyDigest = 'privacy-digest',
  ImportMail = 'import-mail',
  InAppNotifications = 'in-app-notifications',
  BiometricAuthentication = 'biometric-authentication',
  LoadRemoteContent = 'load-remote-content',
  SignatureManager = 'signature-manager',
  SwipeSettings = 'swipe-settings',
  AliasInboxes = 'alias-inboxes',
  Filters = 'filters',
  SpamList = 'spam-list',
  BrowserNotifications = 'web-push-notifications',
  BuyDomain = 'buy-domain',
  Profile = 'profile',
  AlreadySilenced = 'already-silenced',
  SuggestedSilence = 'suggested-silence',
  MetricSilence = 'metric-silence',
  MailtoHandler = 'mailto-handler',
  // Skiff pages
  ImportFiles = 'import-files',
  OrganizationName = 'organization-name',
  OrganizationMemberList = 'organization-member-list',
  StorageManagement = 'storage-management',
  StorageFormat = 'storage-format',
  IconFormat = 'icon-format',
  TableOfContents = 'table-of-contents',
  StorageUsage = 'storage-usage',
  TeamList = 'team-list',
  Logout = 'logout',
  SecuredBySkiffSignature = 'secured-by-skiff-signature',
  // Skiff Calendar
  ImportCalendar = 'import-event',
  ImportGoogleCalendar = 'import-google-calendar',
  CalendarView = 'calendar-view',
  StartDayOfTheWeek = 'start-day-of-the-week',
  TimeZone = 'time-zone',
  DefaultColor = 'default-color'
}

export const SETTINGS_LABELS: Record<Exclude<SettingValue, SettingValue.EmptySetting>, string> = {
  [SettingValue.Profile]: 'Profile',
  [SettingValue.AccountRecovery]: 'Account recovery',
  [SettingValue.AutoAdvance]: 'Auto-advance',
  [SettingValue.AddEmail]: 'Add recovery email',
  [SettingValue.AddEmailAlias]: 'Email addresses',
  [SettingValue.AliasTagList]: 'Quick Alias domains',
  [SettingValue.DefaultEmail]: 'Default email address',
  [SettingValue.RecoveryEmail]: 'Recovery email',
  [SettingValue.AddWalletAlias]: 'Wallet addresses',
  [SettingValue.DeleteRecoveryEmail]: 'Delete recovery email',
  [SettingValue.CustomDomainSetup]: 'Setup domain',
  [SettingValue.CustomDomainManage]: 'Manage domains',
  [SettingValue.DateHourFormat]: 'Date and hour format',
  [SettingValue.DeleteAccount]: 'Delete account',
  [SettingValue.EditProfile]: 'Edit profile',
  [SettingValue.ENSAlias]: 'ENS address',
  [SettingValue.LastVerifiedDate]: 'Last verified date',
  [SettingValue.MailboxLayout]: 'Mailbox layout',
  [SettingValue.Notifications]: 'Notifications',
  [SettingValue.SetupMFA]: 'Two-factor authentication',
  [SettingValue.ChangePassword]: 'Change password',
  [SettingValue.CryptoBanner]: 'Pay with Crypto',
  [SettingValue.SubscriptionPlans]: 'Subscription plans',
  [SettingValue.CreditManagement]: 'Skiff credits',
  [SettingValue.Theme]: 'Theme',
  [SettingValue.VerificationPhrase]: 'View verification phrase',
  [SettingValue.Contacts]: 'Contacts',
  [SettingValue.ContactsImport]: 'Import contacts',
  [SettingValue.ContactsAutoSync]: 'Auto-add email contacts',
  [SettingValue.ContactsDeviceSync]: 'Auto-add device contacts',
  [SettingValue.PaymentDetails]: 'Payment details',
  [SettingValue.InvoiceHistory]: 'Invoice history',
  [SettingValue.CurrentSubscriptions]: 'Current subscriptions',
  [SettingValue.QuickAlias]: 'Quick Alias',
  [SettingValue.QuickAliasBanner]: 'Quick Alias banner',
  [SettingValue.PgpKeys]: 'Encryption keys',
  [SettingValue.AttachPgp]: 'Always attach public key',
  [SettingValue.QuickAliasSubdomain]: 'Alias subdomain',
  // Skiff mail
  [SettingValue.AutoForwarding]: 'Auto-forwarding',
  [SettingValue.AutoReply]: 'Auto reply',
  [SettingValue.EmailNotifications]: 'Email comment notifications',
  [SettingValue.PrivacyDigest]: 'Privacy Digest newsletter',
  [SettingValue.ImportMail]: 'Import mail',
  [SettingValue.BiometricAuthentication]: 'Biometric authentication',
  [SettingValue.LoadRemoteContent]: 'Block remote content',
  [SettingValue.SignatureManager]: 'Signature manager',
  [SettingValue.AliasInboxes]: 'Address inboxes',
  [SettingValue.Filters]: 'Filters',
  [SettingValue.SpamList]: 'Spam list',
  [SettingValue.BrowserNotifications]: 'Browser notifications',
  [SettingValue.BuyDomain]: 'Buy a domain',
  [SettingValue.AlreadySilenced]: 'Already silenced',
  [SettingValue.SuggestedSilence]: 'Silence suggestions',
  [SettingValue.MetricSilence]: 'Silence metrics',
  [SettingValue.MailtoHandler]: 'Handle mailto: links',
  // Skiff pages
  [SettingValue.ImportFiles]: 'Import files',
  [SettingValue.OrganizationMemberList]: 'Member list',
  [SettingValue.TeamList]: 'Teams',
  [SettingValue.OrganizationName]: 'Organization name',
  [SettingValue.StorageManagement]: 'Storage management',
  [SettingValue.StorageFormat]: 'Storage format',
  [SettingValue.IconFormat]: 'Page icons',
  [SettingValue.TableOfContents]: 'Table of contents',
  [SettingValue.StorageUsage]: 'Storage usage',
  [SettingValue.InAppNotifications]: 'In-app notifications',
  [SettingValue.Logout]: 'Logout',
  [SettingValue.SecuredBySkiffSignature]: 'Sign off with Skiff signature',
  [SettingValue.SwipeSettings]: 'Swipe settings',
  // Skiff calendar
  [SettingValue.ImportCalendar]: 'Import calendar',
  [SettingValue.ImportGoogleCalendar]: 'Import google calendar',
  [SettingValue.CalendarView]: 'Calendar view',
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
  hasInnerPage?: boolean;
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
