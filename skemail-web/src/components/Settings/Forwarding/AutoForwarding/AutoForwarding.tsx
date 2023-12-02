import { Icon } from 'nightwatch-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import {
  useDisableEmailAutoForwardingMutation,
  useEnableEmailAutoForwardingMutation,
  useGetEmailAutoForwardingSettingsQuery
} from 'skiff-front-graphql';
import { ConfirmModal, DEFAULT_WORKSPACE_EVENT_VERSION, TitleActionSection, useToast } from 'skiff-front-utils';
import { AuthAction, EmailAutoForwardingClient, ImportClients, WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import {
  clearAuthCodes,
  getGoogleOAuth2CodeInURL,
  getOutlookCodeInURL,
  signIntoGoogle,
  signIntoOutlook
} from '../../../../utils/importEmails';
import { storeWorkspaceEvent } from '../../../../utils/userUtils';
import { SignIntoGoogle, SignIntoOutlook } from '../../../shared/SignIntoExternalProvider';

import { AutoForwardingOption } from './AutoForwardingOption';

const AutoForwardClientsList = styled.div`
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const AutoForwarding: React.FC = () => {
  const [isGmailEnabled, setIsGmailEnabled] = useState(false);
  const [showGoogleLoginModal, setShowGoogleLoginModal] = useState(false);
  const [isOutlookEnabled, setIsOutlookEnabled] = useState(false);
  const [showOutlookLoginModal, setShowOutlookLoginModal] = useState(false);
  // Show confirm modal before disabling auto-forwarding
  const [disableForwardingModalClient, setDisableForwardingModalClient] = useState<EmailAutoForwardingClient>();

  const { data, loading } = useGetEmailAutoForwardingSettingsQuery();
  const [enableEmailAutoForwardingMutation] = useEnableEmailAutoForwardingMutation();
  const [disableEmailAutoForwardingMutation] = useDisableEmailAutoForwardingMutation();

  useEffect(() => {
    if (!loading && data) {
      setIsGmailEnabled(data.emailAutoForwardingSettings.gmail.enabled);
      setIsOutlookEnabled(data.emailAutoForwardingSettings.outlook.enabled);
    }
  }, [data, loading]);

  const { enqueueToast } = useToast();

  const handleGoogleAuth = async () => {
    try {
      await signIntoGoogle(client, AuthAction.AutoForward);
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Authentication failed',
        body: 'Could not sign into Google. Please try again.'
      });
    }
  };
  const handleOutlookAuth = async () => {
    try {
      await signIntoOutlook(AuthAction.AutoForward);
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Authentication failed',
        body: 'Could not sign into Outlook. Please try again.'
      });
    }
  };
  // check if there is google auth code in the query params
  const { authCode: googleAuthClientCode, state: googleStateCode } = getGoogleOAuth2CodeInURL();
  const { authCode: outlookAuthClientCode, state: outlookStateCode } = getOutlookCodeInURL();

  const closeSignInModal = useCallback(
    (autoForwardingClient: EmailAutoForwardingClient) => {
      if (autoForwardingClient === EmailAutoForwardingClient.Gmail) {
        // clean code query params
        if (googleAuthClientCode) {
          clearAuthCodes(ImportClients.Gmail);
        }
        setShowGoogleLoginModal(false);
      }

      if (autoForwardingClient === EmailAutoForwardingClient.Outlook) {
        // clean code query params
        if (outlookAuthClientCode) {
          clearAuthCodes(ImportClients.Outlook);
        }
        setShowOutlookLoginModal(false);
      }
    },
    [googleAuthClientCode, outlookAuthClientCode]
  );

  const updateEnabledDisabledState = useCallback((autoForwardingClient: EmailAutoForwardingClient, state: boolean) => {
    if (autoForwardingClient === EmailAutoForwardingClient.Gmail) {
      setIsGmailEnabled(state);
    } else if (autoForwardingClient === EmailAutoForwardingClient.Outlook) {
      setIsOutlookEnabled(state);
    }
  }, []);

  const enableAutoForwarding = useCallback(
    async (autoForwardingClient: EmailAutoForwardingClient, authCode: string, state: string) => {
      try {
        await enableEmailAutoForwardingMutation({
          variables: {
            request: {
              client: autoForwardingClient,
              code: authCode,
              state
            }
          }
        });

        updateEnabledDisabledState(autoForwardingClient, true);
        void storeWorkspaceEvent(
          WorkspaceEventType.AutoForwardingEnabled,
          autoForwardingClient,
          DEFAULT_WORKSPACE_EVENT_VERSION
        );

        // After auto-forwarding has been enabled, show a success toast
        enqueueToast({
          title: 'Auto-forwarding enabled',
          body: `Incoming mail from ${autoForwardingClient} will be forwarded to Skiff Mail.`
        });
      } catch (error) {
        enqueueToast({
          title: `Failed to enable auto-forwarding`,
          body: 'Please try again later.'
        });
      }
      closeSignInModal(autoForwardingClient);
    },
    [closeSignInModal, enableEmailAutoForwardingMutation, enqueueToast, updateEnabledDisabledState]
  );

  const disableAutoForwarding = async (autoForwardingClient: EmailAutoForwardingClient) => {
    try {
      await disableEmailAutoForwardingMutation({
        variables: {
          request: {
            client: autoForwardingClient
          }
        }
      });
      updateEnabledDisabledState(autoForwardingClient, false);
      void storeWorkspaceEvent(
        WorkspaceEventType.AutoForwardingDisabled,
        autoForwardingClient,
        DEFAULT_WORKSPACE_EVENT_VERSION
      );

      // After auto-forwarding has been disabled, show a success toast
      enqueueToast({
        title: 'Auto-forwarding disabled',
        body: `Incoming mail from ${autoForwardingClient} will no longer be forwarded to Skiff Mail.`
      });
    } catch (error) {
      enqueueToast({
        title: `Failed to disable auto-forwarding`,
        body: 'Please try again later.'
      });
    }
  };

  useEffect(() => {
    // After signing into Google, enable auto-forwarding
    if (googleAuthClientCode && !isGmailEnabled) {
      void enableAutoForwarding(EmailAutoForwardingClient.Gmail, googleAuthClientCode, googleStateCode);
    }
    // After signing into Outlook, enable auto-forwarding
    if (outlookAuthClientCode && !isOutlookEnabled) {
      void enableAutoForwarding(EmailAutoForwardingClient.Outlook, outlookAuthClientCode, outlookStateCode);
    }
  }, [googleAuthClientCode, isGmailEnabled, enableAutoForwarding, outlookAuthClientCode, isOutlookEnabled]);

  const getSignInLabel = (provider: EmailAutoForwardingClient) => `Forward your ${provider} messages to Skiff`;

  const getOptionSubLabel = (provider: EmailAutoForwardingClient, isProviderEnabled: boolean) => {
    if (isMobile) return undefined;
    return isProviderEnabled ? `Your ${provider} account is connected.` : `Forward messages from ${provider}.`;
  };

  const closeConfirmModal = () => {
    setDisableForwardingModalClient(undefined);
  };

  return (
    <>
      <TitleActionSection subtitle='Have emails sent to your old email address automatically forward to your Skiff address' />
      <AutoForwardClientsList>
        <AutoForwardingOption
          icon={Icon.Gmail}
          iconColor='source'
          isEnabled={isGmailEnabled}
          label='Gmail'
          onClick={() => {
            if (!isGmailEnabled) {
              // If we are enabling auto-forwarding, show the login modal
              setShowGoogleLoginModal(true);
            } else {
              // If we are disabling auto-forwarding, show the confirm modal
              setDisableForwardingModalClient(EmailAutoForwardingClient.Gmail);
            }
          }}
          subLabel={getOptionSubLabel(EmailAutoForwardingClient.Gmail, isGmailEnabled)}
        />
        <AutoForwardingOption
          icon={Icon.Outlook}
          iconColor='source'
          isEnabled={isOutlookEnabled}
          label='Outlook'
          onClick={() => {
            if (!isOutlookEnabled) {
              // If we are enabling auto-forwarding, show the login modal
              setShowOutlookLoginModal(true);
            } else {
              // If we are disabling auto-forwarding, show the confirm modal
              setDisableForwardingModalClient(EmailAutoForwardingClient.Outlook);
            }
          }}
          subLabel={getOptionSubLabel(EmailAutoForwardingClient.Outlook, isOutlookEnabled)}
        />
      </AutoForwardClientsList>
      <SignIntoGoogle
        actionLabel={getSignInLabel(EmailAutoForwardingClient.Gmail)}
        handleGoogleAuth={handleGoogleAuth}
        onClose={() => closeSignInModal(EmailAutoForwardingClient.Gmail)}
        open={showGoogleLoginModal}
      />
      <SignIntoOutlook
        actionLabel={getSignInLabel(EmailAutoForwardingClient.Outlook)}
        handleOutlookAuth={handleOutlookAuth}
        onClose={() => closeSignInModal(EmailAutoForwardingClient.Outlook)}
        open={showOutlookLoginModal}
      />
      <ConfirmModal
        confirmName='Disable'
        description={`You will no longer automatically receive emails from your ${
          disableForwardingModalClient ?? ''
        } account.`}
        destructive
        onClose={closeConfirmModal}
        onConfirm={() => {
          if (!disableForwardingModalClient) {
            // We should never reach this point, as the modal should be closed
            // if showDisabledModalClient is undefined
            console.error('Could not disable auto-forwarding. No client provided.');
            enqueueToast({
              title: 'Could not disable auto-forwarding',
              body: 'Please try again later.'
            });
            closeConfirmModal();
            return;
          }
          void disableAutoForwarding(disableForwardingModalClient);
          closeConfirmModal();
        }}
        open={!!disableForwardingModalClient}
        title={`Disable ${disableForwardingModalClient ?? ''} auto-forwarding?`}
      />
    </>
  );
};
