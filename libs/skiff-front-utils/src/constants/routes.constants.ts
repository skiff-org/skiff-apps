import { isMacOs, isWindows } from 'react-device-detect';

export const DRIVE_PATH = 'drive';
export const CALENDAR_PATH = 'calendar';

export const IPFS_BASE_URL = 'https://infura-ipfs.io/ipfs';

export const SKIFF_PUBLIC_WEBSITE = 'https://skiff.com';

export const SKIFF_PUBLIC_WEBSITE_FAQ = SKIFF_PUBLIC_WEBSITE + '/faq';
export const SKIFF_PUBLIC_WEBSITE_VIDEOS = SKIFF_PUBLIC_WEBSITE + '/videos';
export const SKIFF_PUBLIC_WEBSITE_DOWNLOAD = SKIFF_PUBLIC_WEBSITE + '/download';
export const CUSTOM_DOMAIN_SETUP_BLOG = SKIFF_PUBLIC_WEBSITE + '/blog/custom-domain-setup';

// Referral params for attribution
export const MAIL_ATTRIBUTION_PARAM = '?r=mail';
export const CALENDAR_ATTRIBUTION_PARAM = '?r=calendar';

// redirects to App Store or Google Play based on user device
export const MAIL_MOBILE_APP_DOWNLOAD_LINK = SKIFF_PUBLIC_WEBSITE_DOWNLOAD + MAIL_ATTRIBUTION_PARAM;

export const SKIFF_DISCORD = 'https://discord.gg/skiff';

// Mail Apps
export const IPHONE_MAIL_APP_URL = 'https://apps.apple.com/us/app/id1619168801';
export const ANDROID_MAIL_APP_URL = 'https://play.google.com/store/apps/details?id=com.skemailmobileapp';

// Editor Apps
export const IPHONE_EDITOR_APP_URL = 'https://apps.apple.com/us/app/id1599795319';
export const ANDROID_EDITOR_APP_URL = 'https://play.google.com/store/apps/details?id=com.skiffmobileapp&hl=en_US&gl=US';

// macOS app URL
const MAC_OS_APP_URL = 'https://apps.apple.com/us/app/skiff-desktop/id1615488683';

// GitHub macOS app URL
const GITHUB_WINDOWS_APP_URL = 'https://github.com/skiff-org/skiff-org.github.io/raw/main/windows/beta/SkiffSetup.msi';

export const GITHUB_APP_URL = () => {
  if (isWindows) {
    return GITHUB_WINDOWS_APP_URL;
  } else if (isMacOs) {
    return MAC_OS_APP_URL;
  } else {
    return GITHUB_WINDOWS_APP_URL;
  }
};

export enum QueryParam {
  REFERRAL = 'referral',
  SOURCE = 's',
  CONTENT = 'c',
  WALLET = 'w',
  MAIL = 'mail',
  PAGES = 'pages',
  CALENDAR = 'calendar',
  DRIVE = 'drive',
  EMAIL = 'email',
  TITLE = 't',
  DATA = 'd',
  PLAN = 'plan',
  PLAN_INTERVAL = 'interval'
}

export enum EditorAppRoutes {
  HOME = '/',
  SIGN_UP = '/signup',
  SIGN_UP_MOBILE = '/signupMobile',
  MAIL_SIGNUP = '/signupMail', // equivalent to /signup?mail
  LOGIN = '/login',
  DRIVE = '/drive',
  DASHBOARD = '/dashboard',
  DRIVE_DASHBOARD = '/drive/dashboard',
  FOLDER = '/folder/:docID',
  DRIVE_FOLDER = '/drive/folder/:docID',
  SETTINGS = '/settings',
  DRIVE_SETTINGS = '/drive/settings',
  EDITOR = '/file/:docID/:deepLink?',
  DRIVE_EDITOR = '/drive/file/:docID/:deepLink?',
  TRASH = '/trash',
  EXTERNAL = '/external',
  DRIVE_EXTERNAL = '/drive/external',
  DRIVE_TRASH = '/drive/trash',
  LINK = '/docs/:docID/:deepLink?',
  DRIVE_LINK = '/drive/docs/:docID/:deepLink?',
  REQUEST = '/request',
  VERIFY_EMAIL = '/verify',
  ADD_EMAIL = '/addEmail',
  SHARED = '/shared/:orgID?',
  DRIVE_SHARED = '/drive/shared/:orgID?',
  SEARCH = '/search',
  WORKSPACE_DOC_LINK = '/docs/:docID#:hashKey',
  DRIVE_WORKSPACE_DOC_LINK = '/drive/docs/:docID#:hashKey',
  WORKSPACE_SETUP = '/setupWorkspace',
  /**
   * Our Cloudflare WAF is configured to serve a managed challenge at this path.
   *
   * If the user passes the challenge, then Cloudflare will serve our actual app
   * at this path. So if our app ever encounters this route, we should
   * immediately redirect (e.g. to `HOME`) so the user can continue using the app.
   */
  CLOUDFLARE_MANAGED_CHALLENGE = '/cloudflare/managedChallenge'
}
