import { Icon } from 'nightwatch-ui';

import {
  BulkSilenceData,
  BulkSilenceSortLabel,
  BulkSilenceSortMode,
  SuggestedBulkSilenceSender,
  UnsubscribeKey,
  isSilenceSenderIndividual,
  isSilenceSenderSuggestion
} from './BulkSilenceModal.types';

export const UnsubscribeSortLabels: Record<BulkSilenceSortMode, BulkSilenceSortLabel> = {
  [BulkSilenceSortMode.Alphabetical]: {
    label: 'A-Z',
    key: 'name',
    icon: Icon.SortDescending
  },
  [BulkSilenceSortMode.NumEmails]: {
    label: 'Messages',
    key: 'messages',
    icon: Icon.EnvelopeRead
  }
};

export const WARN_EMAIL_CUTOFF = 30;

export const transformArrayToRecord = (data: SuggestedBulkSilenceSender[], key: string): BulkSilenceData => {
  return data.reduce((acc, item) => {
    let itemValue = '';
    if (key === UnsubscribeKey.Domain && isSilenceSenderSuggestion(item)) {
      itemValue = item.domain;
    } else if (key === UnsubscribeKey.Sender && isSilenceSenderIndividual(item)) {
      itemValue = item.sender;
    }
    if (itemValue) acc[itemValue] = item;
    return acc;
  }, {});
};
