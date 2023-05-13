import { Icon, IconButton, Icons, Type, Typography, TypographySize } from 'nightwatch-ui';
import { useCallback, useEffect, useState } from 'react';
import {
  GetUserMfaQuery,
  LoginSrpRequest,
  checkMFAEnabled,
  disableMfa,
  enrollMfa,
  regenerateMfaBackupCodes,
  useLoginSrpStep2Mutation
} from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  MFADialog,
  SettingAction,
  StepsMFA,
  TitleActionSection,
  configureMFA,
  useRegisterKey,
  useRequiredCurrentUserData,
  useToast
} from 'skiff-front-utils';
import { LoginMutationStatus, MfaTypes, RequestStatus, WorkspaceEventType } from 'skiff-graphql';
import { insertIf } from 'skiff-utils';
import styled from 'styled-components';

import { isMobile } from 'react-device-detect';
import client from '../../../../apollo/client';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

const MfaListContainer = styled.div`
  display: flex;
  gap: 8px;
  flex-direction: column;
`;

const MfaDataContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 8px 8px 12px;
  box-sizing: border-box;
  gap: 12px;
  border-radius: 8px;
  background: var(--bg-overlay-tertiary);
`;

const MfaLeftJustifiedContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: calc(100% - 85px);
  gap: 12px;
`;

const NameUsed = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

const MfaRightJustifiedContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MonoAdjust = styled.div`
  margin-top: 3px;
`;

/**
 * Component for setting up MFA in AccountSettings.
 */
function SetupMFA() {
  const [loginSrpStep2] = useLoginSrpStep2Mutation();
  const userData = useRequiredCurrentUserData();
  const { enqueueToast } = useToast();

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
  // array of one-time-use backup codes received from server after MFA setup
  // an undefined state means that the backup codes are still being generated
  const [backupCodes, setBackupCodes] = useState<Array<string> | undefined>(undefined);
  // whether authentication modal is open
  const [authenticationOpen, setAuthenticationOpen] = useState<{
    isOpen: boolean;
    type: undefined | MfaTypes;
    credentialIDtoDisable: string | undefined;
    totpDisable: boolean | undefined;
  }>({ isOpen: false, type: undefined, credentialIDtoDisable: undefined, totpDisable: undefined });
  // whether the user has webauthn enabled
  const [hasWebauthnEnabled, setHasWebauthnEnabled] = useState(false);
  // whether the user has totp enabled
  const [hasTotpEnabled, setHasTotpEnabled] = useState(false);
  const [mfaTypes, setMfaTypes] = useState<string[]>([]);
  const [userMfaData, setUserMfaData] = useState<GetUserMfaQuery['user']>(undefined);
  // wehther the hardware key is being registered, needed for callback
  const [isRegisteringKey, setIsRegisteringKey] = useState(false);

  const runRegistration = useRegisterKey();

  // Check whether or not MFA is enabled to correctly set the toggle state and re-download the secret
  const checkMFA = useCallback(async () => {
    const curUserMfaTypes: Array<string> = [];
    const userMFAData = await checkMFAEnabled(client, userData.userID);
    if (userMFAData.mfa) {
      setUserMfaData(userMFAData);
      const hasWebauthn = (userMFAData.mfa.webAuthnKeys ?? []).length > 0;
      const hasTotp = !!userMFAData.mfa.totpData;
      const hasBackup = (userMFAData.mfa.backupCodes ?? []).length > 0;
      setHasWebauthnEnabled(hasWebauthn);
      setHasTotpEnabled(hasTotp);
      if (hasWebauthn) {
        curUserMfaTypes.push(MfaTypes.Webauthn);
      }
      if (hasTotp) {
        curUserMfaTypes.push(MfaTypes.Totp);
      }
      if (hasBackup) {
        curUserMfaTypes.push(MfaTypes.BackupCode);
      }
      setMfaTypes(curUserMfaTypes);

      // backup codes are generated with totp
      if (hasWebauthn || hasTotp) {
        setIsMFAEnabled(true);
      } else {
        setIsMFAEnabled(false);
      }
    }
    // we want this to run when modal open state changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData.userID, authenticationOpen.isOpen, isRegisteringKey]);

  // Sets the key and if MFA is enabled based on userData
  useEffect(() => {
    void checkMFA();
  }, [checkMFA]);

  // Re-authenticate user
  const onSubmitAuthentication = async (loginSrpRequest: LoginSrpRequest) => {
    const typeToEnable = authenticationOpen.type;
    const isAddingTotpToWebauthn = isMFAEnabled && typeToEnable === MfaTypes.Totp && hasWebauthnEnabled;
    const isAddingWebauthnToTotp = isMFAEnabled && typeToEnable === MfaTypes.Webauthn && hasTotpEnabled;
    // Authenticate
    if (!isMFAEnabled || isAddingTotpToWebauthn || isAddingWebauthnToTotp) {
      // if no MFA, show password, then authenticate
      const response = await loginSrpStep2({ variables: { request: loginSrpRequest } });
      if (response.data?.loginSrp?.status !== LoginMutationStatus.Authenticated) {
        return false;
      }
      const { generatedSecret, url, error: mfaConfigurationError } = await configureMFA(userData.username);
      setTotpSeed(generatedSecret);
      setDataMFA(generatedSecret);
      setQrUrl(url);
      setError(mfaConfigurationError);
      setStepMFA(StepsMFA.VIEW_QR_CODE_MFA);
      // if adding Webauthn to TOTP,register without dialog
      if (isAddingWebauthnToTotp) {
        setIsRegisteringKey(true);
        await runRegistration(hasTotpEnabled);
        setIsRegisteringKey(false);
      } else {
        // Enabling
        setIsMFADialogOpen(true);
      }
    } else if (!typeToEnable && isMFAEnabled) {
      // Disabling
      const disableMfaRequest = {
        client,
        loginSrpRequest,
        credentialID: authenticationOpen.credentialIDtoDisable,
        disableTotp: authenticationOpen.totpDisable ?? false
      };
      const disableResult = await disableMfa(disableMfaRequest);
      if (disableResult) {
        setIsMFAEnabled(false);
        void storeWorkspaceEvent(WorkspaceEventType.TwoFactorToggle, 'disable', DEFAULT_WORKSPACE_EVENT_VERSION);
      } else {
        return false;
      }
    } else if (typeToEnable === MfaTypes.BackupCode) {
      const result = await regenerateMfaBackupCodes(client, userData, loginSrpRequest);
      if (result && result.status === RequestStatus.Success) {
        setBackupCodes(result.backupCodes);
        setStepMFA(StepsMFA.GENERATE_BACKUP_CODES);
        setIsMFADialogOpen(true);
      } else {
        // shows error
        return false;
      }
    }
    return true;
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
  const getNewCodes = () => {
    setAuthenticationOpen({
      isOpen: true,
      type: MfaTypes.BackupCode,
      credentialIDtoDisable: undefined,
      totpDisable: undefined
    });
  };

  const getDescriptionText = () => {
    if (authenticationOpen.type === MfaTypes.Webauthn) {
      return 'Please re-authenticate to add a hardware key.';
    } else if (isMFAEnabled) {
      return 'Please re-authenticate to disable two-factor authentication.';
    } else {
      return 'Please re-authenticate to enable two-factor authentication.';
    }
  };

  return (
    <>
      <TitleActionSection
        actions={[
          ...insertIf<SettingAction>(hasTotpEnabled, {
            onClick: () =>
              setAuthenticationOpen({
                isOpen: true,
                type: MfaTypes.Webauthn,
                credentialIDtoDisable: undefined,
                totpDisable: undefined
              }),
            label: 'Add hardware key',
            type: 'button'
          }),
          ...insertIf<SettingAction>(!hasTotpEnabled && hasWebauthnEnabled, {
            onClick: () =>
              setAuthenticationOpen({
                isOpen: true,
                type: MfaTypes.Totp,
                credentialIDtoDisable: undefined,
                totpDisable: undefined
              }),
            label: 'Enable TOTP',
            type: 'button'
          }),
          ...insertIf<SettingAction>(!isMFAEnabled, {
            dataTest: 'toggle-mfa-button',
            onClick: () =>
              setAuthenticationOpen({
                isOpen: true,
                type: undefined,
                credentialIDtoDisable: undefined,
                totpDisable: undefined
              }),
            label: 'Enable',
            type: 'button'
          })
        ]}
        subtitle='Add additional verification to your account'
        title='Two-factor authentication'
      />
      {(hasTotpEnabled || !!userMfaData?.mfa.webAuthnKeys?.length) && (
        <MfaListContainer>
          {userMfaData?.mfa.webAuthnKeys?.map((webauthnData) => (
            <MfaDataContainer key={webauthnData.credentialID}>
              <MfaLeftJustifiedContainer>
                <Icons color='disabled' icon={Icon.Key} size={20} />
                <NameUsed>
                  <Typography>{webauthnData.keyName}</Typography>
                  {!isMobile && (
                    <MonoAdjust>
                      <Typography color='disabled' mono size={TypographySize.SMALL} uppercase wrap>
                        &nbsp;·&nbsp;Last used&nbsp;·&nbsp;
                        {webauthnData.lastSuccessfulChallenge
                          ? new Date(webauthnData.lastSuccessfulChallenge).toDateString().toUpperCase()
                          : 'never'}
                      </Typography>
                    </MonoAdjust>
                  )}
                </NameUsed>
              </MfaLeftJustifiedContainer>
              <MfaRightJustifiedContainer>
                <IconButton
                  icon={Icon.Trash}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAuthenticationOpen({
                      isOpen: true,
                      type: undefined,
                      credentialIDtoDisable: webauthnData.credentialID,
                      totpDisable: undefined
                    });
                  }}
                  tooltip='Disable credential'
                  type={Type.SECONDARY}
                />
              </MfaRightJustifiedContainer>
            </MfaDataContainer>
          ))}
          {hasTotpEnabled && (
            <MfaDataContainer>
              <MfaLeftJustifiedContainer>
                <Icons color='disabled' icon={Icon.QrCodeScan} size={20} />
                <Typography>Authenticator app</Typography>
              </MfaLeftJustifiedContainer>
              <MfaRightJustifiedContainer>
                {userMfaData?.mfa.backupCodes && (
                  <IconButton
                    icon={Icon.History}
                    onClick={(e) => {
                      e.stopPropagation();
                      getNewCodes();
                    }}
                    tooltip='Regenerate backup codes'
                    type={Type.SECONDARY}
                  />
                )}
                <IconButton
                  icon={Icon.Trash}
                  onClick={(e) => {
                    e?.stopPropagation();
                    if (userMfaData?.mfa.webAuthnKeys && userMfaData?.mfa.webAuthnKeys?.length > 0) {
                      enqueueToast({
                        title: 'Remove hardware keys',
                        body: 'Please remove hardware keys before disabling TOTP'
                      });
                      return;
                    }
                    setAuthenticationOpen({
                      isOpen: true,
                      type: undefined,
                      credentialIDtoDisable: undefined,
                      totpDisable: true
                    });
                  }}
                  tooltip='Remove TOTP'
                  type={Type.SECONDARY}
                />
              </MfaRightJustifiedContainer>
            </MfaDataContainer>
          )}
        </MfaListContainer>
      )}
      {/* Re-authentication dialog */}
      <ConfirmPasswordDialog
        description={getDescriptionText()}
        handleSubmit={onSubmitAuthentication}
        onClose={() =>
          setAuthenticationOpen({
            isOpen: false,
            type: undefined,
            credentialIDtoDisable: undefined,
            totpDisable: undefined
          })
        }
        open={authenticationOpen.isOpen}
      />
      {/* Enable MFA dialog */}
      <MFADialog
        backupCodes={backupCodes}
        checkMFA={checkMFA}
        dataMFA={dataMFA}
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
        userMfaTypes={mfaTypes}
        username={userData.username}
      />
    </>
  );
}

export default SetupMFA;
