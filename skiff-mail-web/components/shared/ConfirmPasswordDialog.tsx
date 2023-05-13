import { startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/typescript-types';
import React, { useState } from 'react';
import { useLoginSrpStep2Mutation } from 'skiff-front-graphql';
import { ConfirmPasswordModalBase, useRequiredCurrentUserData } from 'skiff-front-utils';
import { LoginMutationStatus, LoginSrpRequest } from 'skiff-graphql';

import { getLoginSrpRequest } from '../../utils/loginUtils';

interface ConfirmPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  handleSubmit: (loginSrpRequest: LoginSrpRequest) => Promise<boolean>;
  description?: string;
}

// Wrapper around ConfirmPasswordModalBase with GraphQL logic
function ConfirmPasswordDialog(props: ConfirmPasswordDialogProps) {
  const { open, onClose, handleSubmit, description } = props;
  const [showTokenMFAModal, setShowTokenMFAModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const userData = useRequiredCurrentUserData();
  const { username } = userData;
  const [loginSrpStep2] = useLoginSrpStep2Mutation();
  const closeAndResetFields = () => {
    onClose();
    setShowTokenMFAModal(false);
    setErrorMsg('');
  };

  const onSubmit = async (password: string, tokenMFA: string) => {
    const loginSrpRequest = await getLoginSrpRequest(username, password, tokenMFA);
    const authenticationErrMessage = showTokenMFAModal
      ? 'Authentication failed. Please check your two-factor authentication token.'
      : 'Authentication failed. Please check your password.';

    // Error message for non-authentication related errors
    const standardErrMessage = 'An error occurred. Please contact support@skiff.org if this persists.';

    if (!tokenMFA && !showTokenMFAModal) {
      const response = await loginSrpStep2({
        variables: {
          request: loginSrpRequest
        }
      });
      const status = response.data?.loginSrp?.status;
      if (status === LoginMutationStatus.TokenNeeded) {
        setShowTokenMFAModal(true);
        return;
      } else if (
        status === LoginMutationStatus.WebauthnTokenNeeded &&
        response.data?.loginSrp.webAuthnChallengeResponse
      ) {
        const challenge = JSON.parse(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
          response.data.loginSrp.webAuthnChallengeResponse.options
        ) as PublicKeyCredentialCreationOptionsJSON;
        const completedAuthInfo = await startAuthentication(challenge);
        loginSrpRequest.verifyWebAuthnData = completedAuthInfo;
      } else if (status !== LoginMutationStatus.Authenticated) {
        setErrorMsg(authenticationErrMessage);
        return;
      }
    }
    try {
      const result = await handleSubmit(loginSrpRequest);
      if (result) {
        closeAndResetFields();
      } else {
        setErrorMsg(standardErrMessage);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(standardErrMessage);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <ConfirmPasswordModalBase
      description={description}
      encryptedMetamaskSecret={userData.encryptedMetamaskSecret || ''}
      errorMsg={errorMsg}
      onClose={closeAndResetFields}
      onSubmit={onSubmit}
      open={open}
      setErrorMsg={setErrorMsg}
      setShowTokenMFA={setShowTokenMFAModal}
      showTokenMFA={showTokenMFAModal}
    />
  );
}

export default ConfirmPasswordDialog;
