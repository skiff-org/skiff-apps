import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { SETTINGS_QUERY_PARAM, SettingIndices, TABS_QUERY_PARAM } from 'skiff-front-utils';
import { SystemLabels } from 'skiff-graphql';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailSettingsReducer } from '../../redux/reducers/settingsReducer';
import { getSearchParams, getSettingsParams, replaceURL, updateURL } from '../../utils/locationUtils';
import { useNavigate } from '../../utils/navigation';

export const useSettings = () => {
  const { navigateToSystemLabel } = useNavigate();
  const dispatch = useDispatch();
  const querySearchParams = useAppSelector((state) => state.settings);

  const syncSearchStateAndQuery = useCallback(
    () => dispatch(skemailSettingsReducer.actions.setSettings(getSettingsParams())),
    [dispatch]
  );

  const openSettings = useCallback(
    ({ tab, setting }: Partial<SettingIndices>) => {
      const query = getSearchParams();
      if (tab) query[TABS_QUERY_PARAM] = tab;
      else delete query[TABS_QUERY_PARAM];
      if (setting) query[SETTINGS_QUERY_PARAM] = setting;
      else delete query[SETTINGS_QUERY_PARAM];

      // When redirecting from import action, should navigate back to inbox.
      if (window.location.pathname.includes('oauth')) {
        navigateToSystemLabel(SystemLabels.Inbox, `?${new URLSearchParams(query).toString()}`);
      }
      updateURL(replaceURL({ query })); // Update url without re-rendering entire page
      syncSearchStateAndQuery(); // Sync search state with current query
    },
    [navigateToSystemLabel, syncSearchStateAndQuery]
  );

  const closeSettings = useCallback(() => {
    const query = getSearchParams();
    delete query[TABS_QUERY_PARAM];
    delete query[SETTINGS_QUERY_PARAM];
    // go back to the same location, with the same param (user label or thread id)
    updateURL(replaceURL({ query })); // Update url without re-rendering entire page
    syncSearchStateAndQuery(); // Sync search state with current query
  }, [syncSearchStateAndQuery]);

  const isSettingsOpen = querySearchParams ? !!querySearchParams[TABS_QUERY_PARAM] : false;

  return {
    openSettings,
    closeSettings,
    querySearchParams,
    isSettingsOpen
  };
};
