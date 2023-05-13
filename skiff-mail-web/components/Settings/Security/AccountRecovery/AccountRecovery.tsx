import React, { useCallback, useEffect, useState } from 'react';
import { useLoginSrpStep2Mutation } from 'skiff-front-graphql';
import { getRecoveryDataFromUsername } from 'skiff-front-graphql';
import { models } from 'skiff-front-graphql';
import {
  ConfirmModal,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  TitleActionSection,
  useRequiredCurrentUserData
} from 'skiff-front-utils';
import { LoginMutationStatus, LoginSrpRequest, WorkspaceEventType } from 'skiff-graphql';

import client from '../../../../apollo/client';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

import AccountRecoveryDialog from './AccountRecoveryDialog';

/**
 * Component for rendering the account recovery section of AccountSettings.
 * This component merely contains a button (along with a title and description),
 * whichs opens the account recovery setup dialog.
 */
function AccountRecovery() {
  const [loginSrpStep2] = useLoginSrpStep2Mutation();
  const userData: models.User = useRequiredCurrentUserData();

  // Whether or not account recovery is enabled.
  const [enabled, setEnabled] = useState(false);
  // Opens confirm modal for resetting account recovery key.
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  // Opens modal for re-authenticating.
  const [isAuthenticationOpen, setIsAuthenticationOpen] = useState(false);
  // Opens recovery instruction modal.
  const [isAccountRecoveryDialogOpen, setIsAccountRecoveryDialogOpen] = useState(false);

  const closeConfirmReset = () => setIsConfirmResetOpen(false);
  const openAuthenticationModal = () => setIsAuthenticationOpen(true);

  const checkAccountRecovery = useCallback(async () => {
    const recoveryData = await getRecoveryDataFromUsername(client, userData.username);
    setEnabled(!!recoveryData);
  }, [userData.username]);

  const closeAccountRecoveryDialog = () => {
    setIsAccountRecoveryDialogOpen(false);
    // Update enabled state everytime account recovery dialog closes.
    void checkAccountRecovery();
  };

  const handleOnClick = () => {
    if (enabled) setIsConfirmResetOpen(true);
    else openAuthenticationModal();
  };

  // Runs after getting password -- either open account recovery dialog (enable)
  // or deletes existing account recovery info (disable)
  const onSubmitAuthentication = async (loginSrpRequest: LoginSrpRequest) => {
    // Authenticate
    const response = await loginSrpStep2({ variables: { request: loginSrpRequest } });
    if (response.data?.loginSrp?.status !== LoginMutationStatus.Authenticated) {
      return false;
    }
    // If the user is resetting recovery key, upload recovery data and open account recovery dialog.
    setIsAccountRecoveryDialogOpen(true);
    void storeWorkspaceEvent(WorkspaceEventType.AccountRecoveryKeyReset, '', DEFAULT_WORKSPACE_EVENT_VERSION);
    return true;
  };

  // Fetches the user's recovery data, which is needed to determine current enabled/disabled state.
  useEffect(() => {
    void checkAccountRecovery();
  }, [checkAccountRecovery]);

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: handleOnClick,
            type: 'button',
            label: 'Reset',
            destructive: true
          }
        ]}
        subtitle='Generate a new recovery key and PDF.'
        title='Reset recovery key'
      />
      {/* Account recovery dialog */}
      <AccountRecoveryDialog closeDialog={closeAccountRecoveryDialog} isOpen={isAccountRecoveryDialogOpen} />
      {/* Re-authentication dialog */}
      <ConfirmPasswordDialog
        description='Please re-authenticate to confirm.'
        handleSubmit={onSubmitAuthentication}
        onClose={() => setIsAuthenticationOpen(false)}
        open={isAuthenticationOpen}
      />
      {/* Confirm disabling account recovery dialog */}
      <ConfirmModal
        confirmName='Reset'
        description='Your current recovery key and PDF will be invalidated, and a new key will be generated.'
        destructive
        onClose={closeConfirmReset}
        onConfirm={() => {
          openAuthenticationModal();
          closeConfirmReset();
        }}
        open={isConfirmResetOpen}
        title='Reset account recovery key?'
      />
    </>
  );
}

export default AccountRecovery;
