import { Icon } from 'nightwatch-ui';

export type QuickAliasSortLabel = {
  label: string;
  key: string;
  icon: Icon;
};

export enum QuickAliasSortMode {
  AlphabeticalAscend = 'ALPHABETICAL_ASCEND',
  AlphabeticalDescend = 'ALPHABETICAL_DESCEND',
  DateAscend = 'DATE_ASCEND'
  // NumEmails = 'NUM_EMAILS'
}
