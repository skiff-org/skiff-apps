import { useUserLabelsQuery } from 'skiff-front-graphql';

import { splitUserLabelsByVariant, userLabelFromGraphQL } from '../utils/label';

import { useAppSelector } from './redux/useAppSelector';

/**
 * Get the labelID's that correspond to any Quick Alias filter applied by the user in the "Quick Aliases" mailbox
 */
export const useQuickAliasFilterLabelIDs = () => {
  const { data: userLabelData } = useUserLabelsQuery();
  const { quickAliasLabels } = splitUserLabelsByVariant(userLabelData?.userLabels?.map(userLabelFromGraphQL) ?? []);
  const quickAliasFilter = useAppSelector((state) => state.mailbox.quickAliasFilter);
  if (!quickAliasFilter) {
    return [];
  }
  return quickAliasLabels.filter((label) => !!quickAliasFilter[label.name]).map((activeLabel) => activeLabel.value);
};
