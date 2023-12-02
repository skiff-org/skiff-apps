import { Icon } from 'nightwatch-ui';

export type ProviderDetails = {
  title: string;
  icon: Icon;
  urls: (string | RegExp)[];
};
