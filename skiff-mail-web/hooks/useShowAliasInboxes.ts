import { useFlags } from 'launchdarkly-react-client-sdk';
import { useEffect, useState } from 'react';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { getEnvironment, useUserPreference } from 'skiff-front-utils';
import { AliasInboxFeatureFlag, StorageTypes } from 'skiff-utils';

import { splitUserLabelsByVariant, userLabelFromGraphQL, sortByName } from '../utils/label';

export const useShowAliasInboxes = () => {
  const env = getEnvironment(new URL(window.location.origin));
  const flags = useFlags();
  const aliasInboxesFF = env === 'local' || (flags.aliasInboxes as AliasInboxFeatureFlag);

  const [onlyOneAliasLabel, setOnlyOneAliasLabel] = useState<boolean>();
  const [isAliasInboxesOn] = useUserPreference(StorageTypes.SHOW_ALIAS_INBOXES);
  const { data } = useUserLabelsQuery();
  const allUserLabels = data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName);
  const { aliasLabels } = splitUserLabelsByVariant(allUserLabels ?? []);

  useEffect(() => {
    // Only set onlyOneAliasLabel if the labels have been loaded and there is a
    // new value to set onlyOneAliasLabel to
    if (allUserLabels && onlyOneAliasLabel !== (aliasLabels.length === 1)) {
      setOnlyOneAliasLabel(aliasLabels.length === 1);
    }
  }, [aliasLabels.length, allUserLabels, onlyOneAliasLabel]);

  return { aliasInboxesFF, showAliasInboxes: aliasInboxesFF && isAliasInboxesOn, onlyOneAliasLabel };
};
