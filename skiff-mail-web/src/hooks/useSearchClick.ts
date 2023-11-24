import { useDispatch } from 'react-redux';

import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { ModalType } from '../redux/reducers/modalTypes';
import { skemailSearchReducer } from '../redux/reducers/searchReducer';

import { useAppSelector } from './redux/useAppSelector';
import { useIsFullScreenThreadOpen } from './useIsFullScreenThreadOpen';

/**
 * Determine whether to open the mailbox search bar or command palette based on thread state after clicking
 * a 'Search' CTA.
 */

const useSearchClick = () => {
  const { isSearchBarOpen } = useAppSelector((state) => state.search);

  const dispatch = useDispatch();

  const openCommandPalette = () =>
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.CommandPalette }));
  const isFullScreenThreadOpen = useIsFullScreenThreadOpen();
  const openSearchBar = () => dispatch(skemailSearchReducer.actions.openSearchBar());
  const focusSearchBar = () => dispatch(skemailSearchReducer.actions.setShouldFocus({ shouldFocus: true }));

  const handleSearchClick = () => {
    if (isFullScreenThreadOpen) {
      openCommandPalette();
    } else if (isSearchBarOpen) {
      focusSearchBar();
    } else {
      openSearchBar();
    }
  };
  return { handleSearchClick };
};

export default useSearchClick;
