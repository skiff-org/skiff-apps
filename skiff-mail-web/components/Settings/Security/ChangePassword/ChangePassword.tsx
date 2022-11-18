import { ButtonGroupItem, Dialog } from 'nightwatch-ui';
import React, { useState } from 'react';
import srp from 'secure-remote-password/client';
import {
  createDetachedSignatureAsymmetric,
  createKeyFromSecret,
  createPasswordDerivedSecret,
  createSRPKey
} from 'skiff-crypto';
import {
  PasswordAndConfirmPasswordBlock,
  isMetaMaskEnabled,
  getInjectedAddr,
  encryptSecretWithWallet,
  TitleActionSection
} from 'skiff-front-utils';
import { LoginMutationStatus, SignatureContext } from 'skiff-graphql';
import { LoginSrpRequest } from 'skiff-graphql';
import {
  encryptPrivateUserData,
  UpdateSrpDocument,
  UpdateSrpMutation,
  UpdateSrpMutationVariables
} from 'skiff-mail-graphql';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import { saveCurrentUserData, useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

const STEPS_PASSWORD_CHANGE = {
  LANDING_PAGE: 0,
  CHANGE_MODAL: 1,
  AUTHENTICATE_MODAL: 2
};

const ChangePasswordContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
`;

/**
 * Component for rendering the change password section in AccountSettings.
 */
const ChangePassword: React.FC = () => {
  const userData = useRequiredCurrentUserData();

  const [stepPasswordChange, setStepPasswordChange] = useState(STEPS_PASSWORD_CHANGE.LANDING_PAGE);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');
  // if the user's chosen password is strong enough or not (judged by zxcvbn protocol)
  const [strongPassword, setStrongPassword] = useState(true);

  // resets all password states and modal to landing page
  const resetChangePasswordState = () => {
    setPassword('');
    setConfirmPassword('');
    setStepPasswordChange(STEPS_PASSWORD_CHANGE.LANDING_PAGE);
    setPasswordChangeError('');
  };

  const checkPasswords = () => {
    if (confirmPassword !== password) {
      setPasswordChangeError('Passwords must match.');
      return false;
    }
    if (!strongPassword) {
      setPasswordChangeError('Password is too weak.');
      return false;
    }
    return true;
  };

  const onSubmitChangePassword = () => {
    if (!checkPasswords()) {
      return;
    }
    setStepPasswordChange(STEPS_PASSWORD_CHANGE.AUTHENTICATE_MODAL);
  };

  /**
   * Submit mutation to update SRP variables and change user's password
   * also submit new encryptedUserData
   */
  const updatePassword = async (loginSrpRequest: LoginSrpRequest) => {
    const salt = srp.generateSalt();
    const masterSecret = await createKeyFromSecret(password, salt);
    const verifierPrivateKey = await createSRPKey(masterSecret, salt);
    const verifier = srp.deriveVerifier(verifierPrivateKey);

    const passwordDerivedSecret = createPasswordDerivedSecret(masterSecret, salt);
    const encryptedPrivateNewUserData = encryptPrivateUserData(userData.privateUserData, passwordDerivedSecret);
    // Get signatures
    const saltSignature = createDetachedSignatureAsymmetric(
      salt,
      userData.privateUserData
        ? userData.privateUserData.signingPrivateKey
          ? userData.privateUserData.signingPrivateKey
          : ''
        : '',
      SignatureContext.SrpSalt
    );
    const verifierSignature = createDetachedSignatureAsymmetric(
      verifier,
      userData.privateUserData
        ? userData.privateUserData.signingPrivateKey
          ? userData.privateUserData.signingPrivateKey
          : ''
        : '',
      SignatureContext.SrpVerifier
    );
    const userDataSignature = createDetachedSignatureAsymmetric(
      encryptedPrivateNewUserData,
      userData.privateUserData
        ? userData.privateUserData.signingPrivateKey
          ? userData.privateUserData.signingPrivateKey
          : ''
        : '',
      SignatureContext.UpdateUserData
    );
    // Send username, salt, and verifier to server
    let newEncryptedMetamaskSecret: string | undefined;
    if (userData.encryptedMetamaskSecret && isMetaMaskEnabled()) {
      console.log('Requesting permissions for new encryptedMetamaskSecret');
      const ethAddr = await getInjectedAddr();
      if (!ethAddr) {
        console.error('Could not get address');
        return false;
      }
      newEncryptedMetamaskSecret = await encryptSecretWithWallet(ethAddr, password);
    }
    const response = await client.mutate<UpdateSrpMutation, UpdateSrpMutationVariables>({
      mutation: UpdateSrpDocument,
      variables: {
        request: {
          salt,
          verifier,
          encryptedUserData: encryptedPrivateNewUserData,
          loginSrpRequest,
          saltSignature,
          verifierSignature,
          userDataSignature,
          encryptedMetamaskSecret: newEncryptedMetamaskSecret
        }
      }
    });
    const newUserData = { ...userData };
    newUserData.passwordDerivedSecret = passwordDerivedSecret;
    saveCurrentUserData(newUserData);

    const status = response.data?.updateSrp.status;
    if (status === LoginMutationStatus.Updated) {
      setStepPasswordChange(STEPS_PASSWORD_CHANGE.LANDING_PAGE);
      return true;
    }
    if (status === LoginMutationStatus.Rejected) {
      setPasswordChangeError('Failed to update password. Please try again.');
    } else if (status === LoginMutationStatus.AuthFailure) {
      setPasswordChangeError('Authentication was rejected. Please try again.');
    } else {
      setPasswordChangeError('An unkonwn error occurred. Please try again.');
      console.error('Unexpected status received from server.');
    }
    return false;
  };

  // Submits change password form
  function handleChangePasswordKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      onSubmitChangePassword();
    }
  }

  const onChangeModalClose = () => {
    setStepPasswordChange(STEPS_PASSWORD_CHANGE.LANDING_PAGE);
    resetChangePasswordState();
  };

  return (
    <>
      <ConfirmPasswordDialog
        handleSubmit={updatePassword}
        onClose={() => setStepPasswordChange(STEPS_PASSWORD_CHANGE.LANDING_PAGE)}
        open={stepPasswordChange === STEPS_PASSWORD_CHANGE.AUTHENTICATE_MODAL}
      />
      <ChangePasswordContainer>
        <TitleActionSection
          actions={[
            {
              onClick: () => setStepPasswordChange(STEPS_PASSWORD_CHANGE.CHANGE_MODAL),
              label: 'Update',
              type: 'button'
            }
          ]}
          subtitle='Use a strong password'
          title='Change password'
        />
      </ChangePasswordContainer>
      <Dialog
        description="You'll be asked to authenticate afterwards"
        inputField={
          <PasswordAndConfirmPasswordBlock
            confirmPassword={confirmPassword}
            loginError={passwordChangeError}
            onEnterKeyPress={handleChangePasswordKeyPress}
            password={password}
            passwordLabel='New Password'
            setConfirmPassword={setConfirmPassword}
            setLoginError={setPasswordChangeError}
            setPassword={setPassword}
            setStrongPassword={setStrongPassword}
          />
        }
        onClose={onChangeModalClose}
        open={stepPasswordChange === STEPS_PASSWORD_CHANGE.CHANGE_MODAL}
        title='Change Password'
      >
        <ButtonGroupItem label='Next' onClick={onSubmitChangePassword} />
        <ButtonGroupItem label='Cancel' onClick={onChangeModalClose} />
      </Dialog>
    </>
  );
};

export default ChangePassword;
