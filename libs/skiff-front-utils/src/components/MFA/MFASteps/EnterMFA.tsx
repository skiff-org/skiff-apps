import { ButtonGroup, ButtonGroupItem, InputField } from 'nightwatch-ui';
import React, { useCallback, useState } from 'react';
import { RequestStatus, WorkspaceEventType } from 'skiff-graphql';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../../constants';
import { StepsMFA } from '../constants';

type EnterMFAProps = {
  dataMFA: string;
  error: string;
  token: string;
  setDataMFA: React.Dispatch<React.SetStateAction<string>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
  setStep: React.Dispatch<React.SetStateAction<StepsMFA>>;
  setToken: React.Dispatch<React.SetStateAction<string>>;
  checkMFA: () => Promise<void>;
  setBackupCodes: React.Dispatch<React.SetStateAction<string[] | undefined>>;
  storeWorkspaceEvent: (eventName: WorkspaceEventType, data: string, version: string) => Promise<void>;
  enableMfa: () => Promise<{ status: string; backupCodes: string[] }>;
};

/** Component that renders the MFA code step */
function EnterMFA({
  dataMFA,
  error,
  token,
  setError,
  setStep,
  setToken,
  checkMFA,
  setBackupCodes,
  setDataMFA,
  storeWorkspaceEvent,
  enableMfa
}: EnterMFAProps) {
  // Whether MFA code is being submitted
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Input code length
  const codeLength = 6;

  // Determines what to do next when user submits code while setting up MFA
  const onMFACodeSubmit = useCallback(async () => {
    if (token.length !== codeLength) {
      setError('Enter a valid 6-digit code.');
      return;
    }
    const { authenticator } = await import('otplib');
    // this MUST be the same as services/editor/routes/login.ts which checks the MFA code
    authenticator.options = {
      window: [1, 1] // MUST BE POSITIVE!
    };
    if (!authenticator.verify({ token, secret: dataMFA })) {
      setError('Invalid code. Please re-enter your code.');
      return;
    }
    const { status, backupCodes: userCodes } = await enableMfa();
    if (status === RequestStatus.Saved) {
      setBackupCodes(userCodes);
      setStep(StepsMFA.GENERATE_BACKUP_CODES);
      // we re-download the secret with checkMFA because we require authenticating the encrypted secret to disable
      await checkMFA();
      // reset
      setError('');
      setDataMFA('');
      void storeWorkspaceEvent(WorkspaceEventType.TwoFactorToggle, 'enable', DEFAULT_WORKSPACE_EVENT_VERSION);
    } else if (status === RequestStatus.Rejected) {
      setError('Failed to enable, refresh and try again.');
    }
    setToken('');
  }, [
    checkMFA,
    dataMFA,
    enableMfa,
    setBackupCodes,
    setDataMFA,
    setError,
    setStep,
    setToken,
    storeWorkspaceEvent,
    token
  ]);

  // Submit MFA code
  const onSubmit = useCallback(
    async (e?: React.MouseEvent | React.KeyboardEvent) => {
      e?.stopPropagation();
      setIsSubmitting(true);
      await onMFACodeSubmit();
      setIsSubmitting(false);
    },
    [onMFACodeSubmit]
  );

  // Go back to QR code step
  const onBack = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStep(StepsMFA.VIEW_QR_CODE_MFA);
    setToken('');
    setError('');
  };

  return (
    <>
      <InputField
        autoFocus
        errorMsg={error}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setToken(e.target.value);
          setError('');
        }}
        onKeyDown={(e: React.KeyboardEvent) => {
          // Remove focus from field when Enter is pressed
          if (e.key === 'Enter') {
            onSubmit();
          }
        }}
        placeholder={`Enter ${codeLength}-digit code`}
        value={token}
      />
      <ButtonGroup>
        <ButtonGroupItem
          label='Submit code'
          loading={isSubmitting}
          onClick={(e: React.MouseEvent) => void onSubmit(e)}
        />
        <ButtonGroupItem label='Back' onClick={onBack} />
      </ButtonGroup>
    </>
  );
}

export default EnterMFA;
