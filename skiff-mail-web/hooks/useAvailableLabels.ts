import intersection from 'lodash/intersection';
import partition from 'lodash/partition';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { useGetFF } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';
import { GmailImportImprovementsFlag } from 'skiff-utils';

import { useGetCachedSelectedThreads } from '../utils/cache/cache';
import { isPlainLabel, isLabelActive, getSystemLabels, userLabelFromGraphQL, Label } from '../utils/label';

import { RESTRICTED_DRAG_AND_DROP_LABELS } from '../utils/label';

export const useAvailableSystemLabels = () => {
  const hasGmailImportImprovementsFF = useGetFF<GmailImportImprovementsFlag>('gmailImportImprovements');

  const threadFragments = useGetCachedSelectedThreads();
  const existingSystemLabels = intersection(...threadFragments.map((thread) => thread?.attributes.systemLabels ?? []));

  return {
    availableLabels: getSystemLabels(hasGmailImportImprovementsFF).filter(
      (label) =>
        !RESTRICTED_DRAG_AND_DROP_LABELS.has(label.value as SystemLabels) &&
        !existingSystemLabels.some((existingLabel) => existingLabel === label.value)
    ),
    existingLabels: existingSystemLabels
  };
};

export const useAvailableUserLabels = (labelsFilter?: (label: Label) => boolean) => {
  const threadFragments = useGetCachedSelectedThreads();

  const { data, loading } = useUserLabelsQuery();
  const userLabels = (data?.userLabels ?? []).map(userLabelFromGraphQL).filter(labelsFilter || isPlainLabel);

  const [existingLabels, availableLabels] = partition(userLabels, (label) => isLabelActive(label, threadFragments));

  return { existingLabels, availableLabels, loading };
};
