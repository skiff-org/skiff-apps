import { Icon } from 'nightwatch-ui';
import { Setting, SETTINGS_LABELS, SettingType, SettingValue } from 'skiff-front-utils';

import { ReviewSilenceSetting } from './ReviewSilenceSetting';
import { SilenceMetricsSetting } from './SilenceMetricsSetting';
import { SuggestSilenceSetting } from './SuggestSilenceSetting';

export const useSilenceSettings: () => Setting[] = () => {
  // New silence
  // Existing silence

  const settings: Setting[] = [
    {
      type: SettingType.Custom,
      value: SettingValue.MetricSilence,
      component: <SilenceMetricsSetting key='metrics-silenced' />,
      label: SETTINGS_LABELS[SettingValue.MetricSilence],
      icon: Icon.LineChart,
      color: 'red'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.SuggestedSilence,
      component: <SuggestSilenceSetting key='suggested-silenced' />,
      label: SETTINGS_LABELS[SettingValue.SuggestedSilence],
      icon: Icon.Spam,
      color: 'red'
    },
    {
      type: SettingType.Custom,
      value: SettingValue.AlreadySilenced,
      component: <ReviewSilenceSetting key='already-silenced' />,
      label: SETTINGS_LABELS[SettingValue.AlreadySilenced],
      icon: Icon.BulletList,
      color: 'dark-blue'
    }
  ];

  return settings;
};
