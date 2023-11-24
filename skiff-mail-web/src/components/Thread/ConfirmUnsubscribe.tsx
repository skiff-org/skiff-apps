import {
  Alignment,
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogType,
  Layout,
  Size,
  ThemeMode,
  Toggle,
  Typography,
  TypographySize,
  TypographyWeight,
  getThemedColor
} from 'nightwatch-ui';
import React, { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { encryptMessage, useDecryptionServicePublicKeyQuery, useSendMessageMutation } from 'skiff-front-graphql';
import {
  DEFAULT_WORKSPACE_EVENT_VERSION,
  Drawer,
  UnsubscribeLinks,
  useAsyncHcaptcha,
  useRequiredCurrentUserData,
  useToast,
  useUserPreference
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';
import styled from 'styled-components';
import isURL from 'validator/lib/isURL';

import client from '../../apollo/client';
import { preprocessAddressesForEncryption } from '../../utils/composeUtils';
import { storeWorkspaceEvent } from '../../utils/userUtils';
import { convertHtmlToTextContent } from '../MailEditor/mailEditorUtils';

const ToggleContainer = styled.div<{ $theme?: ThemeMode }>`
  display: flex;
  padding: 16px;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  align-self: stretch;
  border-radius: 8px;
  border: 1px solid ${({ $theme }) => getThemedColor('var(--border-secondary)', $theme)};
  background: ${({ $theme }) => getThemedColor('var(--bg-overlay-quaternary)', $theme)};
`;

const DrawerContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-self: stretch;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: stretch;
  padding-top: 12px;
`;

interface ConfirmUnsubscribeProps {
  addressToUnsubFrom: string;
  open: boolean;
  onClose: () => void;
  unsubscribeLinks: UnsubscribeLinks;
  recipientAddress: string;
}

export const openRedirectLink = (httpLink: string) => {
  if (isURL(httpLink)) window.open(httpLink, '_blank', 'noreferrer noopener');
};

export const ConfirmUnsubscribe: React.FC<ConfirmUnsubscribeProps> = ({
  addressToUnsubFrom,
  open,
  onClose,
  unsubscribeLinks,
  recipientAddress
}: ConfirmUnsubscribeProps) => {
  const [, setConfirmUnsubscribeRedirect] = useUserPreference(StorageTypes.CONFIRM_UNSUBSCRIBE_REDIRECT);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const [hcaptchaToken, setHcaptchaToken] = useState<string>('');

  // Hooks
  const userData = useRequiredCurrentUserData();
  const { enqueueToast } = useToast();
  const decryptionServicePublicKey = useDecryptionServicePublicKeyQuery();
  const { requestHcaptchaToken } = useAsyncHcaptcha(true);

  const [sendMessage, { loading: isSendingMessage }] = useSendMessageMutation();

  const { mailto, httpLink } = unsubscribeLinks;

  useEffect(() => {
    // get a token to send later when sending a message
    const getHcaptchaToken = async () => {
      try {
        const token = await requestHcaptchaToken();
        setHcaptchaToken(token);
      } catch (error) {
        console.error('Failed to get hcaptcha token', error);
      }
    };
    if (!hcaptchaToken) {
      void getHcaptchaToken();
    }
  }, [hcaptchaToken, requestHcaptchaToken]);

  // Do not return null on mobile, as it breaks the open animation for the drawer
  if (!open && !isMobile) return null;

  const isRedirectUnsubscribe = !!httpLink;

  const sendUnsubscribeMessage = async () => {
    if (!mailto) return;

    if (!decryptionServicePublicKey.data?.decryptionServicePublicKey) {
      console.error('Could not unsubscribe. External service public key error.');
      enqueueToast({
        title: 'Could not unsubscribe',
        body: 'Failed to send unsubscribe message. Please try again later.'
      });
      return;
    }

    const defaultUnsubscribeMsgSubject = '[Urgent] Unsubscribe Request';
    const defaultUnsubscribeMsgBody = `<p>Please unsubscribe ${
      recipientAddress || 'me'
    } from all of your services immediately.<p>`;

    const { address, subject, body } = mailto;
    const messageSubject = subject ?? defaultUnsubscribeMsgSubject;
    const messageBody = body ?? defaultUnsubscribeMsgBody;
    const {
      encryptedSubject,
      encryptedText,
      encryptedHtml,
      encryptedTextAsHtml,
      encryptedTextSnippet,
      toAddressesWithEncryptedKeys,
      ccAddressesWithEncryptedKeys,
      bccAddressesWithEncryptedKeys,
      externalEncryptedSessionKey,
      fromAddressWithEncryptedKey
    } = await encryptMessage(
      {
        messageSubject,
        messageTextBody: convertHtmlToTextContent(messageBody),
        messageHtmlBody: messageBody,
        attachments: [],
        toAddresses: preprocessAddressesForEncryption([
          {
            address
          }
        ]),
        ccAddresses: [],
        bccAddresses: [],
        fromAddress: {
          name: userData.publicData?.displayName,
          address: recipientAddress
        },
        privateKey: userData.privateUserData.privateKey,
        publicKey: userData.publicKey,
        externalPublicKey: decryptionServicePublicKey.data?.decryptionServicePublicKey
      },
      client
    );

    try {
      await sendMessage({
        variables: {
          request: {
            from: fromAddressWithEncryptedKey,
            to: toAddressesWithEncryptedKeys,
            cc: ccAddressesWithEncryptedKeys,
            bcc: bccAddressesWithEncryptedKeys,
            attachments: [],
            encryptedSubject,
            encryptedText,
            encryptedHtml,
            encryptedTextAsHtml,
            externalEncryptedSessionKey,
            encryptedTextSnippet,
            rawSubject: messageSubject,
            captchaToken: hcaptchaToken
          }
        },
        context: {
          headers: {
            'Apollo-Require-Preflight': true
          }
        }
      });
      enqueueToast({
        title: 'Unsubscribe request sent',
        body: 'A request has been sent to be removed from this mailing list.'
      });
    } catch (error) {
      console.error(error);
      enqueueToast({
        title: 'Could not unsubscribe',
        body: 'Failed to send message. Please try again later.'
      });
    }
  };

  const description = isRedirectUnsubscribe
    ? `You will be redirected to unsubscribe from "${addressToUnsubFrom}"`
    : `An email will be sent from ${recipientAddress} to unsubscribe from "${addressToUnsubFrom}"`;

  const title = isRedirectUnsubscribe ? 'Redirecting to unsubscribe' : 'Unsubscribe from mailing list';

  const forceTheme = isMobile ? ThemeMode.DARK : undefined;

  const renderUnsubscribeContent = () => {
    return (
      <>
        {isRedirectUnsubscribe && (
          <ToggleContainer $theme={forceTheme}>
            <Typography color='secondary' forceTheme={forceTheme}>
              Do not show this again
            </Typography>
            <Toggle
              checked={doNotShowAgain}
              forceTheme={forceTheme}
              onChange={() => {
                setDoNotShowAgain((prev) => !prev);
              }}
              size={Size.MEDIUM}
            />
          </ToggleContainer>
        )}
        <ButtonGroup
          forceTheme={forceTheme}
          fullWidth={isMobile}
          layout={isMobile ? Layout.STACKED : undefined}
          size={isMobile ? Size.LARGE : undefined}
        >
          <ButtonGroupItem
            label={httpLink ? `Continue${isMobile ? ' in browser' : ''}` : 'Confirm'}
            loading={isSendingMessage}
            onClick={async () => {
              if (httpLink) {
                openRedirectLink(httpLink);
              } else if (mailto) {
                await sendUnsubscribeMessage();
              }
              void storeWorkspaceEvent(WorkspaceEventType.MarkUnsubscribe, '', DEFAULT_WORKSPACE_EVENT_VERSION);

              // Update user preference
              // If doNotShowAgain is true, this means we no longer want to
              // prompt to confirm the unsubscribe redirect
              setConfirmUnsubscribeRedirect(!doNotShowAgain);
              onClose();
            }}
          />
          <ButtonGroupItem label='Back' onClick={onClose} />
        </ButtonGroup>
      </>
    );
  };

  return isMobile ? (
    <Drawer forceTheme={forceTheme} hideDrawer={onClose} show={open}>
      <DrawerContent>
        <Header>
          <Typography
            align={Alignment.CENTER}
            forceTheme={forceTheme}
            size={TypographySize.H4}
            weight={TypographyWeight.MEDIUM}
            wrap
          >
            {title}
          </Typography>
          <Typography
            align={Alignment.CENTER}
            color='secondary'
            forceTheme={forceTheme}
            size={TypographySize.LARGE}
            wrap
          >
            {description}
          </Typography>
        </Header>
        {renderUnsubscribeContent()}
      </DrawerContent>
    </Drawer>
  ) : (
    <Dialog
      customContent
      description={description}
      hideCloseButton
      onClose={onClose}
      open={!!unsubscribeLinks && open}
      title={title}
      type={DialogType.CONFIRM}
    >
      {renderUnsubscribeContent()}
    </Dialog>
  );
};
