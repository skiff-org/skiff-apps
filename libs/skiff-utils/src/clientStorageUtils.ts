// Local storage keys
export enum StorageTypes {
  SESSION_CACHE = 'sessionCache', // shared with mail, userID appended
  SAVED_ACCOUNT = 'savedAccount', // shared with mail, userID appended
  FILE_TABLE_SORT_MODE = 'fileTableSort:mode',
  FILE_TABLE_SORT_ORDER = 'fileTableSort:order',
  SIDEPANEL_OPEN = 'sidepanelOpen',
  ORGANIZATION_EVERYONE_TEAM = 'organizationEveryoneTeam',
  DEFAULT_ALIAS = 'DefaultAlias', // shared with mail,
  DRAFT_MESSAGE = 'DraftMessage',
  SEARCH_INDEX = 'MailSearchIndex',
  NOTIFICATION_BANNER_KEY = 'notificationBannerState',
  THREAD_FORMAT = 'threadFormat',
  TOGGLE_ITEM = 'toggleNodes',
  LATEST_USER_ID = 'latestUserID',
  REDIRECT_TO_CALENDAR = 'isRedirectToCalendar',
  HOUR_FORMAT = 'hourFormat',
  DATE_FORMAT = 'dateFormat',
  THEME = 'theme',
  START_DAY_OF_THE_WEEK = 'startDayOfTheWeek',
  TIME_ZONE = 'timeZone',
  DEFAULT_CALENDAR_COLOR = 'defaultCalendarColor',
  HAS_SEEN_CUSTOM_DOMAIN = 'hasSeenCustomDomainPage',
  HAS_SEEN_CUSTOM_DOMAIN_TRIAL_OFFER = 'hasSeenCustomDomainTrialOffer',
  GMAIL_IMPORT_ENABLED = 'gmailImportEnabled',
  HAS_SEEN_CALENDAR = 'hasSeenCalendar',
  CAL_MOBILE_BANNER_APPEARANCES = 'calMobileBannerAppearances',
  SHOW_ALIAS_INBOXES = 'showAliasInboxes',
  HAS_SEEN_ESSENTIAL = 'hasSeenEssential',
  HAS_SEEN_ALIAS_INBOXES = 'hasSeenAliasInboxes',
  BLOCK_REMOTE_CONTENT = 'blockRemoteContent',
  LEFT_SWIPE_GESTURE = 'leftSwipeGesture',
  RIGHT_SWIPE_GESTURE = 'rightSwipeGesture',
  SECURED_BY_SKIFF_SIG_DISABLED = 'securedBySkiffSigDisabled',
  SHOW_PAGE_ICON = 'showPageIcon',
  SKEMAIL_MOBILE_BANNER_APPEARANCES = 'skemailMobileBannerAppearances',
  HAS_SEEN_ACTIVATION_CHECKLIST = 'hasSeenActivationChecklist'
}

export const getStorageKey = (type: StorageTypes): string => `skiff:${type}`;
