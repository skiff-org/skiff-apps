import React, { useCallback, useEffect, useState } from 'react';
import {
  AccountRecoveryAction,
  ConfirmModal,
  TitleActionSection,
  DEFAULT_WORKSPACE_EVENT_VERSION
} from 'skiff-front-utils';
import { LoginMutationStatus, LoginSrpRequest, WorkspaceEventType } from 'skiff-graphql';
import { useLoginSrpStep2Mutation } from 'skiff-mail-graphql';
import { getRecoveryDataFromUsername, uploadRecoveryData } from 'skiff-mail-graphql';
import { models } from 'skiff-mail-graphql';

import client from '../../../../apollo/client';
import { setBrowserRecoveryShare, useRequiredCurrentUserData } from '../../../../apollo/currentUser';
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
  // Opens confirm modal for disabling account recovery.
  const [isConfirmDisableOpen, setIsConfirmDisableOpen] = useState(false);
  // Opens modal for re-authenticating.
  const [isAuthenticationOpen, setIsAuthenticationOpen] = useState(false);
  // Opens recovery instruction modal.
  const [isAccountRecoveryDialogOpen, setIsAccountRecoveryDialogOpen] = useState(false);

  const closeConfirmDisable = () => setIsConfirmDisableOpen(false);
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

  const toggleEnabled = () => {
    if (enabled) setIsConfirmDisableOpen(true);
    else openAuthenticationModal();
  };

  // Runs after getting password -- either open account recovery dialog (enable)
  // or deletes existing account recovery info (disable)
  const onSubmitAuthentication = async (loginSrpRequest: LoginSrpRequest) => {
    // Authenticate
    const response = await loginSrpStep2({ variables: { request: loginSrpRequest } });
    if (response.data?.loginSrp?.status !== LoginMutationStatus.Authenticated) return false;
    // If the user is enabling, upload recovery data and open account recovery dialog.
    if (!enabled) {
      setIsAccountRecoveryDialogOpen(true);
      return true;
    }
    // If the user is disabling, delete account recovery data.
    const recoveryData = await uploadRecoveryData(userData, AccountRecoveryAction.DELETE, client);
    setBrowserRecoveryShare(recoveryData.recoveryBrowserShare);
    setEnabled(false);
    void storeWorkspaceEvent(WorkspaceEventType.AccountRecoveryToggle, 'disable', DEFAULT_WORKSPACE_EVENT_VERSION);
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
            onChange: toggleEnabled,
            checked: enabled,
            type: 'toggle'
          }
        ]}
        subtitle='Set up a backup password phrase.'
        title='Account recovery'
      />
      {/* Account recovery dialog */}
      <AccountRecoveryDialog closeDialog={closeAccountRecoveryDialog} isOpen={isAccountRecoveryDialogOpen} />
      {/* Re-authentication dialog */}
      <ConfirmPasswordDialog
        description={`Please re-authenticate to confirm ${enabled ? 'disabling' : 'enabling'} account recovery.`}
        handleSubmit={onSubmitAuthentication}
        onClose={() => setIsAuthenticationOpen(false)}
        open={isAuthenticationOpen}
      />
      {/* Confirm disabling account recovery dialog */}
      <ConfirmModal
        confirmName='Disable'
        description='If you forget your password, you will not be able to recover your account.'
        destructive
        onClose={closeConfirmDisable}
        onConfirm={() => {
          openAuthenticationModal();
          closeConfirmDisable();
        }}
        open={isConfirmDisableOpen}
        title='Disable account recovery?'
      />
    </>
  );
}

export default AccountRecovery;
