import { AbsolutelyCentered, Button, CircularProgress, Icon, Size, Type, Typography } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../constants';
import { useAvoidIosKeyboard } from '../../hooks';
import useToast from '../../hooks/useToast';
import { copyToClipboardWebAndMobile } from '../../utils';
import InputFieldEndAction from '../InputFieldEndAction/InputFieldEndAction';

// Amount of time to wait before redirect
// Can't await key download
const RECOVERY_KEY_WAIT_TIME = 1500;

export const InstructionContainer = styled.div`
  gap: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const DescriptionBlock = styled.div`
  gap: 8px;
  display: flex;
  flex-direction: column;
`;

export const Description = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Footer = styled.div<{ isSignUp: boolean }>`
  ${(props) => !props.isSignUp && 'display: flex;'}
  align-items: center;
  gap: 16px;
  justify-content: flex-end;
  justify-content: ${(props) => (props.isSignUp ? '' : 'flex-end')};
`;

export const Spacer = styled.div<{ height?: number }>`
  height: ${(props) => props.height ?? 16}px;
  transition: all 0.3s;
`;

const KeyCard = styled.div`
  position: relative;
  overflow: hidden;

  width: 100%;
  min-height: 129px;

  border-radius: 8px;
  box-shadow: var(--inset-empty);
  background-color: var(--bg-overlay-tertiary);
`;

const PhraseContainer = styled.div<{ $isBlurred: boolean }>`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 12px 40px 12px;
  filter: ${({ $isBlurred }) => `blur(${$isBlurred ? 4 : 0}px)`};
  transition: filter 0.1s;
`;

const KeyOptions = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;

  display: flex;
  flex-direction: row;
  gap: 12px;
`;

type AccountRecoveryKeyProps = {
  /** Closes account recovery modal */
  onClose?: () => void;
  /** Downloads PDF */
  onDownloadPDF: () => Promise<void>;
  /** Recovery key */
  recoveryPaperShare: string;

  /** Mobile keyboard height */
  keyboardHeight: number;

  /** Function called after the PDF has been downloaded */
  onNext?: () => void;
  /** Function that accepts a workspace doc invite */
  acceptDocLinkInvite?: (arg: React.Dispatch<React.SetStateAction<boolean>>) => Promise<void>;
};
const CREATE_RECOVERY_NEXT_BTN_MARGIN = 120;

function AccountRecoveryKey({
  onClose,
  onDownloadPDF,
  recoveryPaperShare,
  keyboardHeight,
  onNext
}: AccountRecoveryKeyProps) {
  const { enqueueToast } = useToast();

  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  // Whether or not the recovery key is blurred
  const [isBlurred, setIsBlurred] = useState(true);

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If onClose is not defined, account recovery is not a modal and the user is still signing up.
  const isSignUp = !onClose;

  // For mobile button positioning
  const nextRef = useRef<HTMLDivElement>(null);
  const generateSpacer = useAvoidIosKeyboard(nextRef, CREATE_RECOVERY_NEXT_BTN_MARGIN, keyboardHeight, (margin) => (
    <Spacer height={margin} />
  ));

  // Selects text and copies it to clipboard
  const copyToClipboard = () => {
    copyToClipboardWebAndMobile(recoveryPaperShare);
    enqueueToast({
      title: 'Recovery key copied',
      body: `The recovery key is now in your clipboard.`
    });
  };

  // Exports the recovery key component
  const downloadPDF = async () => {
    try {
      await onDownloadPDF();
      await storeWorkspaceEvent({
        variables: {
          request: {
            eventName: WorkspaceEventType.OnboardingDownloadRecoveryKey,
            data: '',
            version: DEFAULT_WORKSPACE_EVENT_VERSION
          }
        }
      });
    } catch (err) {
      console.error(err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      if (!!onNext) onNext();
    }, RECOVERY_KEY_WAIT_TIME);
  };

  // Interactive key card for users who are still signing up
  const renderKeyCard = () => (
    <KeyCard>
      {recoveryPaperShare && (
        <>
          <PhraseContainer $isBlurred={isBlurred}>
            <Typography
              color={isBlurred ? 'disabled' : 'secondary'}
              dataTest='recovery-key-text'
              selectable={!isBlurred}
              wrap
            >
              {recoveryPaperShare}
            </Typography>
          </PhraseContainer>
          <KeyOptions>
            <InputFieldEndAction
              icon={Icon.QrCodeScan}
              onClick={() => setIsBlurred(!isBlurred)}
              tooltip={isBlurred ? 'View recovery key' : 'Hide recovery key'}
            />
            <InputFieldEndAction icon={Icon.Copy} onClick={() => void copyToClipboard()} tooltip='Copy to clipboard' />
          </KeyOptions>
        </>
      )}
      {!recoveryPaperShare && (
        <AbsolutelyCentered>
          <CircularProgress size={Size.X_MEDIUM} spinner />
        </AbsolutelyCentered>
      )}
    </KeyCard>
  );

  const onButtonClick = () => {
    setIsSubmitting(true);
    void downloadPDF();
  };

  const renderFooter = () => {
    // The submit button takes up its full width during sign-up
    // The text on a full-width button changes to "Downloading..." on loading
    // If the button is not in full-width, the text is hidden during loading to prevent a layout shift
    const showDownloading = isSubmitting && isSignUp;
    const text = isSignUp ? 'Download key' : 'Save key as PDF';
    return (
      <Footer isSignUp={isSignUp}>
        {!isSignUp && (
          <Button onClick={onClose} size={isMobile ? Size.LARGE : Size.MEDIUM} type={Type.SECONDARY}>
            Cancel
          </Button>
        )}
        <Button
          dataTest='enable-recovery'
          fullWidth={isSignUp}
          loading={showDownloading ? false : isSubmitting}
          onClick={onButtonClick}
          ref={nextRef}
          size={isMobile ? Size.LARGE : Size.MEDIUM}
        >
          {showDownloading ? 'Downloading...' : text}
        </Button>
      </Footer>
    );
  };

  return (
    <>
      <InstructionContainer>
        {/* Modal key card */}
        {renderKeyCard()}
        {isMobile && generateSpacer()}
        {renderFooter()}
      </InstructionContainer>
    </>
  );
}

export default AccountRecoveryKey;
