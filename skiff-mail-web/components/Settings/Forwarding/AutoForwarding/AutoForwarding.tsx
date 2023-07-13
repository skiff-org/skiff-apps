import { Icon } from '@skiff-org/skiff-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { TitleActionSection, useToast } from 'skiff-front-utils';
import { ImportClients } from 'skiff-graphql';

import client from '../../../../apollo/client';
import { clearAuthCodes, getGoogleOAuth2CodeInURL, signIntoGoogle } from '../../../../utils/importEmails';
import { SignIntoGmailModal } from '../../../shared/SignIntoGmailModal';

import { AutoForwardingOption } from './AutoForwardingOption';

export const AutoForwarding: React.FC = () => {
  const [isGmailEnabled, setIsGmailEnabled] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);

  // TODO: update the state of isGmailEnabled depending on whether or not we already have it enabled

  const { enqueueToast } = useToast();

  const handleGmailAuth = async () => {
    try {
      await signIntoGoogle(client);
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Authentication failed',
        body: 'Could not sign into Google. Please try again.',
        persist: true
      });
    }
  };

  // check if there is google auth code in the query params
  const googleAuthClientCode = getGoogleOAuth2CodeInURL();

  const closeSignIntoGmailModal = useCallback(() => {
    // clean code query params
    if (googleAuthClientCode) {
      clearAuthCodes(ImportClients.Gmail);
    }
    setShowGoogleLoginModal(false);
  }, [googleAuthClientCode]);

  useEffect(() => {
    // temporarily using the auth code as a proxy for whether or not Gmail auto-forwarding is enabled
    if (googleAuthClientCode && !isGmailEnabled) {
      setIsGmailEnabled(true);
      closeSignIntoGmailModal();
      // TODO: call mutation to enable Gmail auto-forwarding
      // After Gmail auto-forwarding has been enabled, show a success toast
      enqueueToast({
        title: 'Auto-forwarding turned on',
        body: 'Incoming mail from your Gmail account will be forwarded into Skiff Mail.'
      });
    }
  }, [closeSignIntoGmailModal, enqueueToast, googleAuthClientCode, isGmailEnabled]);

  return (
    <>
      <TitleActionSection
        subtitle='Have emails sent to your old email address automatically forward to your Skiff address'
        title='Enable auto-forwarding'
      />
      <AutoForwardingOption
        icon={Icon.Gmail}
        iconColor='source'
        isEnabled={isGmailEnabled}
        label='Gmail'
        onClick={() => {
          if (!isGmailEnabled) {
            setShowGoogleLoginModal(true);
          } else {
            // TODO: call mutation to disable Gmail auto-forwarding
            setIsGmailEnabled(false);
          }
        }}
        subLabel='Forward messages from Gmail.'
      />
      <SignIntoGmailModal
        actionLabel='Forward'
        handleGmailAuth={handleGmailAuth}
        onClose={closeSignIntoGmailModal}
        open={showGoogleLoginModal}
      />
    </>
  );
};
