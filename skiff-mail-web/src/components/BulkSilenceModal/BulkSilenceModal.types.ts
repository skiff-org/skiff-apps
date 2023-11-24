import { Icon } from 'nightwatch-ui';
import { SilenceSenderBulkSuggestion, SilencedDomainAggregation } from 'skiff-graphql';

export type SuggestedBulkSilenceSender = SilenceSenderBulkSuggestion | SilencedDomainAggregation;

export type BulkSilenceSortLabel = {
  label: string;
  key: string;
  icon: Icon;
};

export enum UnsubscribeKey {
  Domain = 'domain',
  Sender = 'sender'
}

export enum BulkSilenceSortMode {
  Alphabetical = 'alphabetical',
  NumEmails = 'messageCount'
}

export type BulkSilenceEntry = [string, SuggestedBulkSilenceSender];

export type BulkSilenceData = Record<string, SuggestedBulkSilenceSender>;

export const isSilenceSenderSuggestion = (data: SuggestedBulkSilenceSender): data is SilencedDomainAggregation => {
  return UnsubscribeKey.Domain in data;
};

export const isSilenceSenderIndividual = (data: SuggestedBulkSilenceSender): data is SilenceSenderBulkSuggestion => {
  return UnsubscribeKey.Sender in data;
};

export type BulkSilenceSenderSectionProps = {
  bulkSilenceData: BulkSilenceData | undefined;
  sortMode: BulkSilenceSortMode;
  sectionLabel?: string;
  checkedItems?: Record<string, boolean>;
  setCheckedItems?: React.Dispatch<React.SetStateAction<Record<string, boolean> | null>>;
  emptyText?: string;
  hide?: boolean;
};

export type BulkSilenceModalSenderTableProps = {
  checkedItems?: Record<string, boolean>;
  setCheckedItems?: React.Dispatch<React.SetStateAction<Record<string, boolean> | null>>;
  loadingSuggestions?: boolean;
  sections: Pick<BulkSilenceSenderSectionProps, 'sectionLabel' | 'bulkSilenceData' | 'emptyText' | 'hide'>[];
  noContainer?: boolean;
};
