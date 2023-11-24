import isEqual from 'lodash/isEqual';
import { useEffect, useState } from 'react';
import { UserLabel } from 'skiff-front-graphql';
import { usePrevious } from 'skiff-front-utils';

import {
  userLabelFromGraphQL,
  isPlainLabel,
  isAliasLabel,
  isQuickAliasLabel,
  UserLabelPlain,
  UserLabelAlias,
  UserLabelQuickAlias
} from '../utils/label';

import { useShowAliasInboxes } from './useShowAliasInboxes';

export const useUserLabelsToRenderAsChips = (userLabels: UserLabel[], includeAliasChips?: boolean) => {
  const { onlyOneAliasLabel, showAliasInboxes } = useShowAliasInboxes();
  const renderAliasChips = includeAliasChips && !onlyOneAliasLabel && showAliasInboxes;

  const prevUserLabels = usePrevious(userLabels);
  const prevShowAliasInbox = usePrevious(showAliasInboxes);
  const prevRenderAliasChips = usePrevious(renderAliasChips);

  const [labelsToRender, setLabelsToRender] = useState<(UserLabelPlain | UserLabelAlias | UserLabelQuickAlias)[]>();

  useEffect(() => {
    if (
      !isEqual(prevUserLabels, userLabels) ||
      prevShowAliasInbox !== showAliasInboxes ||
      prevRenderAliasChips !== renderAliasChips
    ) {
      const threadPlainLabels = userLabels.map(userLabelFromGraphQL).filter(isPlainLabel);
      const threadAliasLabels = userLabels.map(userLabelFromGraphQL).filter(isAliasLabel);
      const threadQuickAliasLabels = userLabels.map(userLabelFromGraphQL).filter(isQuickAliasLabel);
      setLabelsToRender([
        ...threadPlainLabels,
        ...(renderAliasChips ? threadAliasLabels : []),
        ...threadQuickAliasLabels
      ]);
    }
  }, [prevUserLabels, renderAliasChips, userLabels, showAliasInboxes, prevShowAliasInbox, prevRenderAliasChips]);

  return labelsToRender;
};
