import { useRouter } from 'next/router';
import { Dialog, DialogTypes } from 'nightwatch-ui';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { isImportModal, ModalType } from '../../redux/reducers/modalTypes';
import { ImportMail } from '../Settings/Import/ImportMail/ImportMail';

export const ImportMailModal = () => {
  const dispatch = useDispatch();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);

  const router = useRouter();
  const [googleLogin, setGoogleLogin] = useState(false);

  // check if there is google auth code in the query params
  const googleAuthClientCode = isImportModal(openSharedModal) ? openSharedModal.googleAuthClientCode : undefined;
  const outlookAuthClientCode = isImportModal(openSharedModal) ? openSharedModal.outlookAuthClientCode : undefined;

  const onClose = useCallback(() => {
    // clean code query params
    if (googleAuthClientCode || outlookAuthClientCode) {
      void router.replace(router.asPath.split('?')[0], undefined, { shallow: true });
    }

    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch, googleAuthClientCode, outlookAuthClientCode, router]);

  const getTitle = () => {
    if (isImportModal(openSharedModal) && openSharedModal.error) return 'Something went wrong...';
    if (googleLogin) return 'Connect to Gmail';
    return 'Import mail';
  };

  const getDialogType = () => {
    if (isImportModal(openSharedModal) && openSharedModal.error) {
      return DialogTypes.Input;
    }

    return DialogTypes.Default;
  };

  return (
    <Dialog
      customContent
      onClose={onClose}
      open={openSharedModal?.type === ModalType.ImportMail}
      title={getTitle()}
      type={getDialogType()}
    >
      <ImportMail googleLogin={googleLogin} setGoogleLogin={setGoogleLogin} />
    </Dialog>
  );
};
