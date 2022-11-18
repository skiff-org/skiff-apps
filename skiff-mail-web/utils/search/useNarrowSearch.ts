import { uniq } from 'lodash';
import { SystemLabels } from 'skiff-graphql';
import { useUserLabelsQuery } from 'skiff-mail-graphql';
import { trimAndLowercase } from 'skiff-utils';

import { getSearchWorker } from '../../hooks/useSearchWorker';

import { SearchModifierType } from './searchModifiers';
import { ModifierSearchResult, SearchItemType } from './searchTypes';

export const useNarrowSearch = () => {
  const { data, error } = useUserLabelsQuery();
  if (error) {
    console.error(`Failed to retrieve User's labels`, JSON.stringify(error, null, 2));
  }

  const narrowSearch = async (query: string) => {
    const searchStr = trimAndLowercase(query);
    if (!searchStr) {
      return;
    }

    const searchWorker = getSearchWorker();
    const searchResults = (await searchWorker?.search(searchStr, { fields: ['toAddresses', 'fromAddress'] })) ?? [];

    const fromAddressResults: ModifierSearchResult[] = uniq(searchResults.map((email) => email.fromAddress))
      .filter((address) => address.includes(searchStr))
      .map((address) => ({
        type: SearchItemType.MODIFIERS,
        modifier: SearchModifierType.FROM_ADDRESS,
        value: address
      }));
    const toAddressResults: ModifierSearchResult[] = uniq(searchResults.map((email) => email.toAddresses).flat())
      .filter((address) => address.includes(searchStr))
      .map((address) => ({ type: SearchItemType.MODIFIERS, modifier: SearchModifierType.TO_ADDRESS, value: address }));

    const systemLabels = Object.values(SystemLabels).filter((label) => label.toLowerCase().includes(searchStr));
    const userLabels = (data?.userLabels ?? []).filter((label) => {
      return label.labelName.toLowerCase().includes(searchStr);
    });

    const systemLabelResults: ModifierSearchResult[] = systemLabels.map((label) => ({
      type: SearchItemType.MODIFIERS,
      modifier: SearchModifierType.HAS_LABEL,
      value: label
    }));
    const userLabelResults: ModifierSearchResult[] = userLabels?.map((label) => ({
      type: SearchItemType.MODIFIERS,
      modifier: SearchModifierType.HAS_LABEL,
      value: label.labelID
    }));

    const results = [...fromAddressResults, ...toAddressResults, ...systemLabelResults, ...userLabelResults];
    return results;
  };

  return { search: narrowSearch };
};
