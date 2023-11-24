import { useDispatch } from 'react-redux';
import { PaywallErrorCode } from 'skiff-utils';

import { skemailModalReducer } from '../redux/reducers/modalReducer';
import { ModalType } from '../redux/reducers/modalTypes';

/**
 * Returns util function to dispatch a paywall modal for the corresponding code
 */
export function usePaywall() {
  const dispatch = useDispatch();
  const openPaywallModal = (code: PaywallErrorCode) => {
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.Paywall,
        paywallErrorCode: code
      })
    );
  };
  return openPaywallModal;
}
