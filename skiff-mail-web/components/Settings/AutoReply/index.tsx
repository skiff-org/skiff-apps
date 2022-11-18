import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { AutoReplySetting } from './AutoReplySetting';

export const autoReplySettings: Setting[] = [
  {
    type: SettingType.Custom,
    value: SettingValue.AutoReply,
    component: <AutoReplySetting key='auto-reply' />,
    label: SETTINGS_LABELS[SettingValue.AutoReply],
    icon: Icon.Reply,
    color: 'green'
  }
];
