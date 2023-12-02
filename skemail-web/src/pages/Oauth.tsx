import { useParams } from 'react-router-dom';
import { TabPage, SettingValue } from 'skiff-front-utils';

import { useSettings } from '../components/Settings/useSettings';

enum Actions {
  IMPORT = 'import',
  AUTO_FORWARD = 'auto-forward'
}

const Oauth = () => {
  const { action: actionParam } = useParams<{ provider: string; action: string }>();
  const { openSettings } = useSettings();
  if (actionParam === Actions.IMPORT) {
    openSettings({ tab: TabPage.Import, setting: SettingValue.ImportMail });
  } else if (actionParam === Actions.AUTO_FORWARD) {
    openSettings({ tab: TabPage.Forwarding, setting: SettingValue.AutoForwarding });
  }
  return null;
};

export default Oauth;
