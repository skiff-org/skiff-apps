import { Icon } from 'nightwatch-ui';
import { useMemo } from 'react';
import { isMobile } from 'react-device-detect';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';
import { insertIf } from 'skiff-utils';

import { AutoAdvance } from './AutoAdvance/AutoAdvance';
import { MailboxViewMode } from './MailboxViewMode/MailboxViewMode';
import { MailtoHandlerSetting } from './MailtoHandler/MailtoHandler';

export const useInboxSettings: () => Setting[] = () => {
  const settings = useMemo<Setting[]>(
    () => [
      {
        type: SettingType.Custom,
        value: SettingValue.AutoAdvance,
        component: <AutoAdvance key='auto-advance' />,
        label: SETTINGS_LABELS[SettingValue.AutoAdvance],
        icon: Icon.ArrowRight,
        color: 'pink'
      },
      ...insertIf<Setting>(!isMobile, {
        type: SettingType.Custom,
        label: SETTINGS_LABELS[SettingValue.MailboxLayout],
        value: SettingValue.MailboxLayout,
        icon: Icon.SplitView,
        color: 'dark-blue',
        component: <MailboxViewMode key='layout' />
      }),
      ...insertIf<Setting>(!!window.navigator?.registerProtocolHandler, {
        type: SettingType.Custom,
        value: SettingValue.MailtoHandler,
        label: 'Open mailto links',
        icon: Icon.Mailbox,
        color: 'blue',
        component: <MailtoHandlerSetting key='mailto' />
      })
    ],
    []
  );

  return settings;
};
