import React, { useCallback, useEffect, useState } from 'react';
import {
  configureMFA,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  MFADialog,
  StepsMFA,
  TitleActionSection,
  SettingAction
} from 'skiff-front-utils';
import { LoginMutationStatus, LoginSrpRequest, RequestStatus, WorkspaceEventType } from 'skiff-graphql';
import {
  checkMFAEnabled,
  disableMfa,
  enrollMfa,
  getMFABackupCodes,
  regenerateMfaBackupCodes,
  useLoginSrpStep2Mutation
} from 'skiff-mail-graphql';
import { insertIf } from 'skiff-utils';

import client from '../../../../apollo/client';
import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

/**
 * Component for setting up MFA in AccountSettings.
 */
function SetupMFA() {
  const [loginSrpStep2] = useLoginSrpStep2Mutation();
  const userData = useRequiredCurrentUserData();
  const displayName = userData?.email ?? userData?.username;

  // MFA setup error
  const [error, setError] = useState('');
  // QR code url
  const [qrUrl, setQrUrl] = useState('');
  // TOTP
  const [totpSeed, setTotpSeed] = useState('');
  // value in token text box
  const [tokenMFA, setTokenMFA] = useState('');
  // secret MFA for enrollment - used to generate QR code
  const [dataMFA, setDataMFA] = useState('');
  // step in setup dialog
  const [stepMFA, setStepMFA] = useState<StepsMFA>(StepsMFA.LANDING_PAGE);
  // whether MFA dialog is open or closed
  const [isMFADialogOpen, setIsMFADialogOpen] = useState(false);
  // whether MFA is currently enabled
  const [isMFAEnabled, setIsMFAEnabled] = useState(false);
  // encrypted MFA key if MFA is enabled
  const [encryptedMFAKey, setEncryptedMFAKey] = useState('');
  // array of one-time-use backup codes received from server after MFA setup
  // an undefined state means that the backup codes are still being generated
  const [backupCodes, setBackupCodes] = useState<Array<string> | undefined>(undefined);
  // whether authentication modal is open
  const [isAuthenticationOpen, setIsAuthenticationOpen] = useState(false);

  // Check whether or not MFA is enabled to correctly set the toggle state and re-download the secret
  const checkMFA = useCallback(async () => {
    const userKey = await checkMFAEnabled(client, userData.userID);
    if (userKey) {
      // If enabled, a string is returned
      setEncryptedMFAKey(userKey);
      setIsMFAEnabled(true);
    } else {
      setIsMFAEnabled(false);
    }
  }, [userData.userID]);

  // Sets the key and if MFA is enabled based on userData
  useEffect(() => {
    void checkMFA();
  }, [checkMFA]);

  // Re-authenticate user
  const onSubmitAuthentication = async (loginSrpRequest: LoginSrpRequest) => {
    // Authenticate
    const response = await loginSrpStep2({ variables: { request: loginSrpRequest } });
    if (response.data?.loginSrp?.status !== LoginMutationStatus.Authenticated) return false;
    if (!isMFAEnabled) {
      // Enabling
      setIsMFADialogOpen(true);
      const { generatedSecret, url, error: mfaConfigurationError } = await configureMFA(userData.username);
      setTotpSeed(generatedSecret);
      setDataMFA(generatedSecret);
      setQrUrl(url);
      setError(mfaConfigurationError);
      setStepMFA(StepsMFA.VIEW_QR_CODE_MFA);
    } else {
      // Disabling
      const disableResult = await disableMfa(client, userData, encryptedMFAKey);
      if (disableResult) {
        setIsMFAEnabled(false);
        setEncryptedMFAKey('');
        void storeWorkspaceEvent(WorkspaceEventType.TwoFactorToggle, 'disable', DEFAULT_WORKSPACE_EVENT_VERSION);
      }
    }
    return true;
  };

  // View backup codes
  const viewBackupCodes = async () => {
    const userCodes = await getMFABackupCodes(client, userData.username);
    if (!userCodes) return;

    setBackupCodes(userCodes);
    setStepMFA(StepsMFA.GENERATE_BACKUP_CODES);
    setIsMFADialogOpen(true);
  };

  // Run enable MFA
  // Return the status and the newly generated backup codes
  const enableMfa = async () =>
    (await enrollMfa(client, userData, dataMFA)) as {
      status: RequestStatus;
      backupCodes: string[];
    };

  // Regenerate and return new backup codes
  // Returns false if the request failed
  const getNewCodes = async () => {
    const result = await regenerateMfaBackupCodes(client, userData);
    if (!result || result.status !== RequestStatus.Success) return false;
    return result.backupCodes;
  };

  return (
    <>
      <TitleActionSection
        actions={[
          ...insertIf<SettingAction>(isMFAEnabled, {
            onClick: viewBackupCodes,
            label: 'View backup',
            type: 'button'
          }),
          {
            dataTest: 'toggle-mfa-button',
            onChange: () => setIsAuthenticationOpen(true),
            checked: isMFAEnabled,
            type: 'toggle'
          }
        ]}
        subtitle='Add additional verification to your account.'
        title='Two-factor authentication'
      />
      {/* Re-authentication dialog */}
      <ConfirmPasswordDialog
        description={`Please re-authenticate to confirm ${
          isMFAEnabled ? 'disabling' : 'enabling'
        } two-factor authentication.`}
        handleSubmit={onSubmitAuthentication}
        onClose={() => setIsAuthenticationOpen(false)}
        open={isAuthenticationOpen}
      />
      {/* Enable MFA dialog */}
      <MFADialog
        backupCodes={backupCodes}
        checkMFA={checkMFA}
        dataMFA={dataMFA}
        displayName={displayName}
        enableMfa={enableMfa}
        error={error}
        getNewCodes={getNewCodes}
        isOpen={isMFADialogOpen}
        qrUrl={qrUrl}
        setBackupCodes={setBackupCodes}
        setDataMFA={setDataMFA}
        setError={setError}
        setIsOpen={setIsMFADialogOpen}
        setStep={setStepMFA}
        setToken={setTokenMFA}
        step={stepMFA}
        storeWorkspaceEvent={storeWorkspaceEvent}
        token={tokenMFA}
        totpSeed={totpSeed}
        username={userData.username}
      />
    </>
  );
}

export default SetupMFA;
