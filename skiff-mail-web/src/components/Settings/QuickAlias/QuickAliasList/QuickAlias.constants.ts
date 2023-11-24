import { Icon } from 'nightwatch-ui';

import { QuickAliasSortLabel, QuickAliasSortMode } from './QuickAlias.types';

export const QuickAliasSortLabels: Record<QuickAliasSortMode, QuickAliasSortLabel> = {
  [QuickAliasSortMode.AlphabeticalAscend]: {
    label: 'Name (A-Z)',
    key: 'descend-name',
    icon: Icon.SortDescending
  },
  [QuickAliasSortMode.AlphabeticalDescend]: {
    label: 'Name (Z-A)',
    key: 'ascend-name',
    icon: Icon.SortAscending
  },
  [QuickAliasSortMode.DateAscend]: {
    label: 'Created',
    key: 'createdAt',
    icon: Icon.Calendar
  }
};

export const QUICK_ALIAS_POLL_INTERVAL = 5_000;

export const EXAMPLE_TAGS = [
  'questionnaire',
  'prescription',
  'socialmedia',
  'newsletter',
  'promotions',
  'freetrials',
  'deliveries',
  'datingapp',
  'shopping'
];
