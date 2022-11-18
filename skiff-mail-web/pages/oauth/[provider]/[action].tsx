import { useRouter } from 'next/router';
import { TabPage, SettingValue } from 'skiff-front-utils';

import { useSettings } from '../../../components/Settings/useSettings';
enum Actions {
  IMPORT = 'import'
}
/** google auth page redirects with code query param - the function check if he exists in the current window url */
export const getOAuth2CodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const scope = url.searchParams.get('scope');
    const user = url.searchParams.get('authuser');
    return scope && user ? authCode : null;
  } catch (err) {
    return null;
  }
};

/** outlook auth page redirects with code query param - the function check if he exists in the current window url */
export const getOutlookCodeInURL = () => {
  try {
    if (!window) return null;
    const url = new URL(window.location.href);
    const authCode = url.searchParams.get('code');
    const session = url.searchParams.get('client_info');
    return session ? authCode : null;
  } catch (err) {
    return null;
  }
};

const Oauth = () => {
  const router = useRouter();
  const { openSettings } = useSettings();
  if (router.query.action === Actions.IMPORT) {
    openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
  }
  return null;
};

export default Oauth;
