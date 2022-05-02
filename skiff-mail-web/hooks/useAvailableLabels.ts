import { intersection, partition } from 'lodash';

import { SystemLabels, useUserLabelsQuery } from '../generated/graphql';
import { useGetCachedSelectedThreads } from '../utils/cache';
import { SYSTEM_LABELS, UserLabel, userLabelFromGraphQL } from '../utils/label';
import { RESTRICTED_DRAG_AND_DROP_LABELS } from './../utils/label';

export const useAvailabeSystemLabels = () => {
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

export const useAvailableUserLabels = () => {
  const threadFragments = useGetCachedSelectedThreads();

  const { data, loading } = useUserLabelsQuery();
  const userLabels: UserLabel[] = (data?.userLabels ?? []).map(userLabelFromGraphQL);

  const [existingLabels, availableLabels] = partition(userLabels, (label) =>
    threadFragments.every(
      (thread) => !!thread?.attributes.userLabels.find((userLabel) => userLabel.labelName === label.value)
    )
  );

  return { existingLabels, availableLabels, loading };
};
