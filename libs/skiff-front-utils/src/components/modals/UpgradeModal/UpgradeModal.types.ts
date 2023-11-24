import { ApolloClient, NormalizedCacheObject } from '@apollo/client';

import { SelectItemType } from './UpgradeModal.constants';

export interface ExceededItem {
  numSelected: number;
  maxAllowed: number;
}

export interface UpgradeModalProps {
  client: ApolloClient<NormalizedCacheObject>;
  description: string;
  open: boolean;
  onClose: () => void;
  exceededItems?: {
    [key in keyof SelectItemType]?: ExceededItem;
  };
  title?: string;
}
