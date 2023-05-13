import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { ConfirmDeleteAccountModal, TitleActionSection, useRequiredCurrentUserData } from 'skiff-front-utils';
import { LoginSrpRequest } from 'skiff-graphql';

import { useMailLogout } from '../../../../hooks/useMailLogout';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { deleteAccount } from '../../../../utils/userUtils';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

enum DeleteModalType {
  NONE,
  CONFIRM_PASSWORD,
  CONFIRM_DELETION
}

/**
 * Component for rendering the interface to delete one's own account.
 */
function DeleteAccount() {
  const userData = useRequiredCurrentUserData();
  const dispatch = useDispatch();
  const logout = useMailLogout();

  const closeSettingsModal = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch]);

  const [currentModal, setCurrentModal] = useState(DeleteModalType.NONE);
  const [loginSrpRequest, setLoginSrpRequest] = useState<LoginSrpRequest | null>(null);

  const closeDeleteModal = () => setCurrentModal(DeleteModalType.NONE);

  async function performAccountDeletion() {
    if (!loginSrpRequest) {
      console.error('Re-authentication failed -- loginSrpRequest not set correctly');
      setCurrentModal(DeleteModalType.CONFIRM_PASSWORD);
      return false;
    }
    const success = await deleteAccount(userData, loginSrpRequest);
    if (success) {
      closeDeleteModal();
      closeSettingsModal();
      void logout();
      return true;
    }
    return false;
  }

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: () => setCurrentModal(DeleteModalType.CONFIRM_PASSWORD),
            label: 'Delete',
            type: 'button',
            destructive: true
          }
        ]}
        destructive
        subtitle='Erase all your content and data'
        title='Delete account'
      />
      <ConfirmPasswordDialog
        description='Please re-authenticate to confirm deletion.'
        handleSubmit={(req) => {
          setLoginSrpRequest(req);
          setCurrentModal(DeleteModalType.CONFIRM_DELETION);
          return new Promise(() => true);
        }}
        onClose={closeDeleteModal}
        open={currentModal === DeleteModalType.CONFIRM_PASSWORD}
      />
      <ConfirmDeleteAccountModal
        onClose={closeDeleteModal}
        onConfirm={performAccountDeletion}
        open={currentModal === DeleteModalType.CONFIRM_DELETION}
      />
    </>
  );
}

export default DeleteAccount;
