import { Dialog } from '@skiff-org/skiff-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { WorkspaceEventType } from 'skiff-graphql';

import { StepsMFA } from './constants';
import EnterMFA from './MFASteps/EnterMFA';
import GenerateBackupCodes from './MFASteps/GenerateBackupCodes';
import ViewMFA from './MFASteps/ViewMFA';

type MFADialogProps = {
  /** MFA backup codes */
  backupCodes?: string[];
  /** Checks whether MFA is enabled or not and re-downloads secret if it is */
  checkMFA: () => Promise<void>;
  /** Secret MFA for enrollment - used to generate QR code */
  dataMFA: string;
  /** Function that runs enabling MFA and returns the status and backup codes */
  enableMfa: () => Promise<{ status: string; backupCodes: string[] }>;
  /** Error message */
  error: string;
  /** Function that re-generates and returns new backup codes
   * Returns false if the request failed
   */
  getNewCodes: () => void;
  /** Whether or not dialog is open */
  isOpen: boolean;
  /** QR Code URL */
  qrUrl: string;
  setBackupCodes: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  setDataMFA: React.Dispatch<React.SetStateAction<string>>;
  /** Setter for the error generated on submitting the MFA code */
  setError: React.Dispatch<React.SetStateAction<string>>;
  /** Setter for the MFA dialog's open / close state */
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  /** Setter for the current MFA step */
  setStep: React.Dispatch<React.SetStateAction<StepsMFA>>;
  /** Setter for the user inputted MFA code */
  setToken: React.Dispatch<React.SetStateAction<string>>;
  /** Current MFA step */
  step: StepsMFA;
  storeWorkspaceEvent: (eventName: WorkspaceEventType, data: string, version: string) => Promise<void>;
  /** User inputted MFA code */
  token: string;
  totpSeed: string;
  /** User's username used to name the exported PDF */
  username: string;
  /** Existing user MFA types */
  userMfaTypes?: Array<string>;
};

function MFADialog({
  backupCodes,
  checkMFA,
  dataMFA,
  enableMfa,
  error,
  getNewCodes,
  isOpen,
  qrUrl,
  setBackupCodes,
  setDataMFA,
  setError,
  setIsOpen,
  setStep,
  setToken,
  step,
  storeWorkspaceEvent,
  token,
  totpSeed,
  userMfaTypes,
  username
}: MFADialogProps) {
  const closeDialog = () => {
    setIsOpen(false);
    // Reset
    setToken('');
    setError('');
    void checkMFA();
  };

  return (
    <Dialog
      customContent
      description={
        step === StepsMFA.ENTER_MFA ? 'Enter the confirmation code you see on your authenticator app.' : undefined
      }
      disableOffClick={isMobile}
      onClose={closeDialog}
      open={isOpen}
      title='Two-factor authentication'
    >
      {step === StepsMFA.VIEW_QR_CODE_MFA && (
        <ViewMFA
          closeDialog={closeDialog}
          qrUrl={qrUrl}
          setStep={setStep}
          totpSeed={totpSeed}
          userMfaTypes={userMfaTypes}
        />
      )}
      {step === StepsMFA.ENTER_MFA && (
        <EnterMFA
          checkMFA={checkMFA}
          dataMFA={dataMFA}
          enableMfa={enableMfa}
          error={error}
          setBackupCodes={setBackupCodes}
          setDataMFA={setDataMFA}
          setError={setError}
          setStep={setStep}
          setToken={setToken}
          storeWorkspaceEvent={storeWorkspaceEvent}
          token={token}
        />
      )}
      {step === StepsMFA.GENERATE_BACKUP_CODES && (
        <GenerateBackupCodes backupCodes={backupCodes} getNewCodes={getNewCodes} username={username} />
      )}
    </Dialog>
  );
}

export default MFADialog;
