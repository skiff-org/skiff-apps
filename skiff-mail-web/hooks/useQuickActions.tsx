import { Icon, IconProps } from '@skiff-org/skiff-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { filterByTitle, SearchAction, SearchItemType } from '../utils/searchWorkerUtils';
import { useDrafts } from './useDrafts';

const createAction = (subject: string, onClick: () => void, iconProps: IconProps, cmdTooltip?: string): SearchAction => ({
  itemType: SearchItemType.Action,
  subject,
  onClick,
  iconProps,
  cmdTooltip
});

export const useQuickActions = (query: string): Array<SearchAction> => {
  const [filteredActions, setFilteredActions] = useState<Array<SearchAction>>([]);
  const { composeNewDraft } = useDrafts();
  const dispatch = useDispatch();
  const openCompose = useCallback(() => dispatch(skemailModalReducer.actions.openCompose({})), [dispatch]);

  // Cache so that we don't have infinite re-render on useSearch deps array
  const actions = React.useMemo(() => {
    const composeAction = createAction(
      'Compose message...',
      () => {
        void openCompose();
        composeNewDraft();
      },
      { icon: Icon.Compose },
      '⌘/'
    );
    return [composeAction];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCompose]);

  useEffect(() => {
    if (!query.length) {
      setFilteredActions(actions);
    } else {
      setFilteredActions(filterByTitle(actions, query) as Array<SearchAction>);
    }
  }, [query, actions]);

  return filteredActions;
};
