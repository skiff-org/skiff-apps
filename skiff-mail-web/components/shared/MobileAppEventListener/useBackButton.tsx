import { useDispatch } from 'react-redux';
import { sendRNWebviewMsg } from 'skiff-front-utils';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../../hooks/useThreadActions';
import { skemailMailboxReducer } from '../../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { getSearchParams, replaceURL, updateURL } from '../../../utils/locationUtils';
import { useSettings } from '../../Settings/useSettings';

/**
 * This hook handles android back button click on android
 * @returns handler for android back button press
 */
export default function useBackButton(): () => void {
  const dispatch = useDispatch();
  const { isSettingsOpen, closeSettings } = useSettings();
  const { composeOpen } = useAppSelector((state) => state.modal);
  const { activeThreadID } = useThreadActions();
  const {
    multipleItemSelector,
    showFilterDrawer,
    showAliasDrawer,
    showApplyLabelDrawer,
    showComposeMoreOptionsDrawer,
    showMailboxMoreOptionsDrawer,
    showMailboxSelectDrawer,
    showMoreThreadOptionsDrawer,
    showMoveThreadDrawer,
    showReplyDrawer,
    showReportThreadBlockDrawer
  } = useAppSelector((state) => state.mobileDrawer);

  const onBackClick = () => {
    // If drawer is open close it
    if (showFilterDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowFilterDrawer(false));
    } else if (showAliasDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowAliasDrawer(false));
    } else if (showApplyLabelDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(null));
    } else if (showComposeMoreOptionsDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowComposeMoreOptionsDrawer(false));
    } else if (showMailboxMoreOptionsDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowMailboxMoreOptionsDrawer(false));
    } else if (showMailboxSelectDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowMailboxSelectDrawer(false));
    } else if (showMoreThreadOptionsDrawer.open) {
      return dispatch(
        skemailMobileDrawerReducer.actions.setShowMoreThreadOptionsDrawer({
          open: false,
          emailSpecific: showMoreThreadOptionsDrawer.emailSpecific
        })
      );
    } else if (showMoveThreadDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowMoveThreadDrawer(false));
    } else if (showReplyDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowReplyDrawer(false));
    } else if (showReportThreadBlockDrawer) {
      return dispatch(skemailMobileDrawerReducer.actions.setShowReportThreadBlockDrawer(false));
    } else if (composeOpen) {
      return dispatch(skemailModalReducer.actions.closeCompose());
    }
    // If multiple select is active close it
    else if (multipleItemSelector) {
      return dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
    }
    // If in settings close settings
    else if (isSettingsOpen) {
      return closeSettings();
    }
    // If in thread, close thread
    else if (activeThreadID) {
      // Remove current thread from query
      const query = getSearchParams();
      delete query.threadID;
      delete query.emailID;
      // Update url
      updateURL(replaceURL({ query }));
      // Update redux state
      dispatch(
        skemailMailboxReducer.actions.setActiveThread({
          activeThreadID: undefined,
          activeEmailID: undefined
        })
      );
    } else {
      // Finally if the back button is pressed, minimize the app
      sendRNWebviewMsg('minimize', {});
    }
  };

  return onBackClick;
}
