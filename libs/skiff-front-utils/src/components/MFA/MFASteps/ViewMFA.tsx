import { useFlags } from 'launchdarkly-react-client-sdk';
import {
  ButtonGroup,
  ButtonGroupItem,
  Divider,
  Icon,
  Icons,
  IconText,
  InputField,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useState } from 'react';
import { MfaTypes } from 'skiff-graphql';
import styled from 'styled-components';

import { useToast } from '../../../hooks';
import { copyToClipboardWebAndMobile } from '../../../utils';
import { COPIED_DURATION } from '../../CopyToClipboardButton';
import { StepsMFA } from '../constants';

import { useRegisterKey } from './useRegisterKey';

const QRCodeContainer = styled.div`
  width: 100%;
  display: flex;
  box-sizing: border-box;
  border-radius: 12px;
  justify-content: center;
  align-items: center;
  padding: 10px;
  background: var(--bg-overlay-tertiary);
  justify-content: center;
  > img {
    border-radius: 8px;
    border: 1px solid var(--border-secondary);
  }
`;

const OrSeparatorContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
`;

const OptionContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;

  width: 100%;
  height: 75px;

  background: var(--bg-l3-solid);
  border: 1px solid var(--border-secondary);
  border-radius: 8px;

  &:hover {
    background: var(--bg-overlay-tertiary);
    cursor: pointer;
  }
`;

const OptionContainerText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0px;
  gap: 2px;
`;

type ViewQRCodeProps = {
  closeDialog: () => void;
  qrUrl: string;
  setStep: React.Dispatch<React.SetStateAction<StepsMFA>>;
  totpSeed: string;
  userMfaTypes?: Array<string>;
};

/** Component that renders the step for viewing the QR code and time-based code */
function ViewQRCode({ closeDialog, qrUrl, setStep, totpSeed, userMfaTypes }: ViewQRCodeProps) {
  const [isCopyClicked, setIsCopyClicked] = useState(false);
  const runRegistration = useRegisterKey(closeDialog);
  const flags = useFlags();
  const { enqueueToast } = useToast();
  const hasTotp = userMfaTypes?.includes(MfaTypes.Totp);
  // currently, RN is not set up properly to handle webauthn registration
  const showHardwareKey = !window.ReactNativeWebView;

  const copyToClipboard = () => {
    if (isCopyClicked) return;
    copyToClipboardWebAndMobile(totpSeed);
    setIsCopyClicked(true);
    setTimeout(() => {
      setIsCopyClicked(false);
    }, COPIED_DURATION);
    enqueueToast({
      title: 'Time-based code copied',
      body: 'Authentication code saved to clipboard.'
    });
  };

  const renderClipBoardButton = () => <IconText onClick={copyToClipboard} startIcon={Icon.Copy} />;

  const renderDescription = () => (
    <Typography color='secondary' wrap>
      Set up TOTP by scanning the QR code or copying the code into your authenticator app.
    </Typography>
  );

  return (
    <>
      {showHardwareKey && (
        <>
          <OptionContainer
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              void runRegistration(hasTotp);
            }}
          >
            <OptionContainerText>
              <Typography color='primary'>Have a hardware key?</Typography>
              <Typography color='secondary' wrap>
                Set up biometric authentication or a hardware key.
              </Typography>
            </OptionContainerText>
            <Icons color='disabled' icon={Icon.ChevronRight} size={Size.X_MEDIUM} />
          </OptionContainer>
          {!hasTotp && (
            <OrSeparatorContainer>
              <Divider />
              <Typography
                color='secondary'
                minWidth='20px'
                size={TypographySize.SMALL}
                uppercase
                weight={TypographyWeight.MEDIUM}
              >
                or
              </Typography>
              <Divider />
            </OrSeparatorContainer>
          )}
        </>
      )}
      {!hasTotp && (
        <>
          {renderDescription()}
          {qrUrl && (
            <QRCodeContainer>
              <img alt='MFA QR code' data-test='mfa-qr-code' src={qrUrl} />
            </QRCodeContainer>
          )}
          <InputField dataTest='totp-seed' endAdornment={renderClipBoardButton()} readOnly value={totpSeed} />
          <ButtonGroup>
            <ButtonGroupItem
              dataTest='continue-enter-mfa'
              label='Continue'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setStep(StepsMFA.ENTER_MFA);
              }}
            />
            <ButtonGroupItem
              label='Cancel'
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                closeDialog();
              }}
            />
          </ButtonGroup>
        </>
      )}
    </>
  );
}

export default ViewQRCode;
