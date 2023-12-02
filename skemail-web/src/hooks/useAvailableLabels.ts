import intersection from 'lodash/intersection';
import partition from 'lodash/partition';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { SystemLabels } from 'skiff-graphql';

import { useGetCachedSelectedThreads } from '../utils/cache/cache';
import { isPlainLabel, isLabelActive, SYSTEM_LABELS, userLabelFromGraphQL, Label } from '../utils/label';

import { RESTRICTED_DRAG_AND_DROP_LABELS } from './../utils/label';

export const useAvailableSystemLabels = () => {
  const threadFragments = useGetCachedSelectedThreads();
  const existingSystemLabels = intersection(...threadFragments.map((thread) => thread?.attributes.systemLabels ?? []));

  return {
    availableLabels: SYSTEM_LABELS.filter(
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
