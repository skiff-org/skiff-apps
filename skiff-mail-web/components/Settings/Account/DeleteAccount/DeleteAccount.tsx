import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { TitleActionSection } from 'skiff-front-utils';
import { LoginSrpRequest } from 'skiff-graphql';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import { useMailLogout } from '../../../../hooks/useMailLogout';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { deleteAccount } from '../../../../utils/userUtils';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

const STEPS_ACCOUNT_DELETE = {
  INSTRUCTION_PAGE: 0,
  LOADING: 1,
  CONFIRM_CHANGE: 2
};

/**
 * Component for rendering the change password section in AccountSettings.
 */
function DeleteAccountDialog() {
  const userData = useRequiredCurrentUserData();
  const dispatch = useDispatch();
  const logout = useMailLogout();

  const closeSettingsModal = useCallback(() => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch]);

  // Step initially set to INSTRUCTION_PAGE when dialog loads.
  // Later set to LOADING or CONFIRM_CHANGE as deletion progresses.
  const [stepAccountDelete, setStepAccountDelete] = useState(STEPS_ACCOUNT_DELETE.INSTRUCTION_PAGE);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  async function performAccountDeletion(loginSrpRequest: LoginSrpRequest) {
    const success = await deleteAccount(userData, loginSrpRequest);
    if (success) {
      setStepAccountDelete(STEPS_ACCOUNT_DELETE.CONFIRM_CHANGE);
    } else {
      setStepAccountDelete(STEPS_ACCOUNT_DELETE.INSTRUCTION_PAGE);
    }
    return success;
  }

  /** Resolves async race condition with React hooks */
  useEffect(() => {
    if (stepAccountDelete === STEPS_ACCOUNT_DELETE.CONFIRM_CHANGE) {
      setShowDeleteAccountDialog(false);
      closeSettingsModal();
      logout();
    }
  }, [closeSettingsModal, logout, stepAccountDelete]);

  const openDeleteDialog = () => setShowDeleteAccountDialog(true);
  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: openDeleteDialog,
            label: 'Delete',
            type: 'button',
            destructive: true
          }
        ]}
        destructive
        subtitle='Erase all your content and data.'
        title='Delete account'
      />
      <ConfirmPasswordDialog
        description='Please re-authenticate to confirm deletion.'
        handleSubmit={performAccountDeletion}
        onClose={() => setShowDeleteAccountDialog(false)}
        open={showDeleteAccountDialog}
      />
    </>
  );
}

export default DeleteAccountDialog;
