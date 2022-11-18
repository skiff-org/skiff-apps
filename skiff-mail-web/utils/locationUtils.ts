import { TabPage, SettingValue, TABS_QUERY_PARAM, SETTINGS_QUERY_PARAM } from 'skiff-front-utils';

export function getSearchParams() {
  if (typeof window !== 'object') return {};
  const urlSearchParams = new URLSearchParams(window.location.search);
  return Object.fromEntries(urlSearchParams.entries());
}

export function getInitialThreadParams() {
  const { threadID: activeThreadID, emailID: activeEmailID } = getSearchParams();
  return { activeThreadID, activeEmailID };
}

// Get and validate initial settings params
export function getSettingsParams() {
  const params = getSearchParams();
  // Check if TabPage is valid
  if (params[TABS_QUERY_PARAM] && !Object.values<string>(TabPage).includes(params[TABS_QUERY_PARAM])) {
    params[TABS_QUERY_PARAM] = TabPage.Empty; // Default to empty
  }
  // Check if Setting is valid
  if (params[SETTINGS_QUERY_PARAM] && !Object.values<string>(SettingValue).includes(params[SETTINGS_QUERY_PARAM])) {
    params[SETTINGS_QUERY_PARAM] = SettingValue.EmptySetting;
  }

  const settingsQuery: {
    [TABS_QUERY_PARAM]?: TabPage;
    [SETTINGS_QUERY_PARAM]?: SettingValue;
  } = {};

  if (params[TABS_QUERY_PARAM]) {
    settingsQuery[TABS_QUERY_PARAM] = params[TABS_QUERY_PARAM] as TabPage;
    if (params[SETTINGS_QUERY_PARAM])
      settingsQuery[SETTINGS_QUERY_PARAM] = params[SETTINGS_QUERY_PARAM] as SettingValue;
  }

  return settingsQuery;
}

interface ConstructURLParams {
  url: string;
  pathname?: string;
  query?: Record<string, string>;
  hash?: string;
}
export function constructURL({ url, pathname, query, hash }: ConstructURLParams) {
  if (typeof window !== 'object') return '';
  const newUrl = new URL(url);
  if (pathname) {
    newUrl.pathname = pathname;
  }
  if (query) {
    Object.entries(query).forEach(([param, val]) => {
      newUrl.searchParams.append(param, val);
    });
  }
  if (hash) {
    newUrl.hash = hash;
  }
  return newUrl.toString();
}

function constructAsPath(pathname: string, query: Record<string, string>, hash: string) {
  const queryString = !!Object.values(query).length ? '?' + new URLSearchParams(query).toString() : '';
  const formattedHash = hash && hash.charAt(0) !== '#' ? '#' + hash : hash;
  return pathname + queryString + formattedHash;
}

interface UpdateURLParams {
  newUrl?: string;
  asPath?: string;
}

export function replaceURL({ url, pathname, query, hash }: Partial<ConstructURLParams>): UpdateURLParams {
  if (typeof window !== 'object') return { newUrl: undefined };
  if (!url) url = window.origin;
  if (!pathname) pathname = window.location.pathname;
  if (!query) query = getSearchParams();
  // prepended with '#' if taken from existing window.location.hash
  if (!hash) hash = window.location.hash;
  return {
    newUrl: constructURL({ url, pathname, query, hash }),
    asPath: constructAsPath(pathname, query, hash)
  };
}

// Next router causes a full page re-render whenever changing routes/params even with shallow=true, to overcome this
// we change query/params/hash with window api re-rendering entire page https://github.com/vercel/next.js/discussions/18072
// this should only be done inside page scope, changing routes (and not query/params/hash) this way will cause problems
// outside page scope changes should be made with next router
export function updateURL({ newUrl, asPath }: UpdateURLParams) {
  if (!newUrl) return;
  // we grab only the pathname after the '/mail' base path for the "as" property of the state object,
  // because next router looks for '/[systemLabel]' on back navigation and will interpret '/mail/[systemLabel]' as a malformed '/[systemLabel]' if asPath not specified
  window.history.pushState({ ...window.history.state, url: newUrl, as: asPath }, '', newUrl);
}
