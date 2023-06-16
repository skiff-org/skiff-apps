import { startRegistration } from '@simplewebauthn/browser';
import { RegistrationResponseJSON } from '@simplewebauthn/typescript-types';
import { useGenerateWebAuthnRegistrationMutation, useVerifyWebAuthnRegistrationMutation } from 'skiff-front-graphql';
import { RequestStatus } from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import { useToast } from '../../../hooks';
import { isPublicKeyCredentialCreationOptionsJSON } from '../webauthnUtils';

export function useRegisterKey(closeDialog?: () => void) {
  const { enqueueToast } = useToast();
  const [generateWebAuthnRegistration] = useGenerateWebAuthnRegistrationMutation();
  const [verifyWebAuthnRegistration] = useVerifyWebAuthnRegistrationMutation();

  const createRegistrationObject = async () => {
    const response = await generateWebAuthnRegistration();
    // We have to disable because we will type guard immediately after.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const options = response.data?.generateWebAuthnRegistration.options;
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
      const parsedOptions = JSON.parse(options);
      if (!isPublicKeyCredentialCreationOptionsJSON(parsedOptions)) {
        console.error('Unable to parse webauthn challenge response from server. Type guard indicates mismatch.');
        return;
      }
      // await the startRegistration so we can catch any errors if the user cancels request
      const regInfo = await startRegistration(parsedOptions);
      return regInfo;
    } catch (e) {
      console.error('WebAuthn registration failed', e);
      return;
    }
  };

  const verifyChallenge = async (verificationData: RegistrationResponseJSON) => {
    const response = await verifyWebAuthnRegistration({
      variables: { request: { verificationData } }
    });
    const verificationResponse = response.data?.verifyWebAuthnRegistration.status;
    if (verificationResponse && verificationResponse === RequestStatus.Saved) {
      enqueueToast({
        title: 'Registration successful',
        body: 'Your MFA device is now active.'
      });
      if (closeDialog) closeDialog();
    } else {
      enqueueToast({
        title: 'Registration failed',
        body: 'Try again or contact support@skiff.org.'
      });
    }
  };

  const runRegistration = async (hasTotp?: boolean) => {
    if (!hasTotp) {
      enqueueToast({
        title: 'First set up TOTP',
        body: 'Please set up TOTP in your authenticator app before setting up a hardware key.'
      });
      return;
    }
    const registration = await createRegistrationObject();
    assertExists(registration, 'Registration object is undefined');
    await verifyChallenge(registration);
  };

  return runRegistration;
}
