import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { skemailMailboxReducer } from '../redux/reducers/mailboxReducer';
import { skemailSettingsReducer } from '../redux/reducers/settingsReducer';
import { getInitialThreadParams, getSettingsParams } from '../utils/locationUtils';

/**
 * This hook syncs redux state with the actual url during forward/back navigation.
 * Used to allow us to trim performance-degrading renders via direct manipulation of
 * window.history without impacting normal back/forward navigation through history stack.
 */

const useSyncURLSearchParams = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    const onBackOrForward = () => {
      dispatch(skemailMailboxReducer.actions.setActiveThread(getInitialThreadParams()));
      dispatch(skemailSettingsReducer.actions.setSettings(getSettingsParams()));
    };
    // fired when active history entry changes while user navigates session history, e.g. via back/forward
    window.addEventListener('popstate', onBackOrForward);
    return () => {
      window.removeEventListener('popstate', onBackOrForward);
    };
  }, [dispatch]);
};

export default useSyncURLSearchParams;
