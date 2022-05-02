import { useCallback, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { MailboxThreadInfo } from '../../models/thread';
import { skemailBottomToolbarReducer } from '../../redux/reducers/bottomToolbarReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { useOnClickOutside } from '../MailEditor/mailEditorUtils/useClickOutside';
import { BOTTOM_TOOLBAR, MultipleItemSelectToolbar, PageToolbar, TOP_TOOLBAR } from '../shared/BottomToolbars';

/**
 * Sets the bottom toolbar to either MultipleItemSelectToolbar or PageToolbar.
 * When clicking outside the outSideClickRef the PageToolbar is shown.
 * @param outSideClickRef the element to use as the click outside reference
 * @param selectedThreadsIds the currently selected threads
 * @param label Current label
 */
export default function useMobilePageToolbar(
  outSideClickRef: React.RefObject<HTMLDivElement>,
  selectedThreadsIds: string[],
  label: string,
  threads: MailboxThreadInfo[]
) {
  const dispatch = useDispatch();
  // Determines if the multi items select is active
  const mobileMultiItemsActive = useAppSelector((state) => state.mobileDrawer.multipleItemSelector);
  const update = useAppSelector((state) => state.toolbar.update);

  const showSettingsDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowSettingsDrawer(true));
  }, [dispatch]);
  const showFilterDrawer = useCallback(() => {
    dispatch(skemailMobileDrawerReducer.actions.setShowFilterDrawer(true));
  }, [dispatch]);
  const onComposeClick = useCallback(() => {
    dispatch(skemailModalReducer.actions.openCompose({}));
  }, [dispatch]);
  const hideMultiItemSelect = useCallback(() => {
    if (mobileMultiItemsActive) {
      dispatch(skemailMobileDrawerReducer.actions.setMultipleItemSelector(false));
    }
  }, [mobileMultiItemsActive, dispatch]);

  // Show the correct toolbar for each case
  const mobileToolbar = useMemo(
    () =>
      mobileMultiItemsActive ? (
        <MultipleItemSelectToolbar selectedThreadsIds={selectedThreadsIds} label={label} threads={threads} />
      ) : (
        <PageToolbar
          onComposeClick={onComposeClick}
          onFilterClick={showFilterDrawer}
          onSettingsClick={showSettingsDrawer}
        />
      ),
    [mobileMultiItemsActive, onComposeClick, showFilterDrawer, selectedThreadsIds]
  );

  //Handle click outside to hide multi item select
  useOnClickOutside(outSideClickRef, hideMultiItemSelect, [BOTTOM_TOOLBAR, TOP_TOOLBAR]);

  // Dispatch correct toolbar
  useEffect(() => {
    dispatch(skemailBottomToolbarReducer.actions.setContent(mobileToolbar));
  }, [mobileToolbar, dispatch, update]);
}
