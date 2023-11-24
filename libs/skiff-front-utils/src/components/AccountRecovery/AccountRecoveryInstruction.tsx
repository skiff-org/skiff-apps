import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  Alignment,
  Button,
  CircularProgress,
  Icon,
  Icons,
  InputField,
  RelativelyCentered,
  Size,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Type,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../constants';
import { useAvoidIosKeyboard, useMediaQuery } from '../../hooks';
import { copyToClipboardWebAndMobile, formatName } from '../../utils';
import { DecodedJWT } from '../../utils/loginUtils';
import { AnimatedCopyIcon, COPIED_DURATION } from '../CopyToClipboardButton';

// Amount of time to wait before redirect
// Can't await key download
const RECOVERY_KEY_WAIT_TIME = 2500;
const INTERACTIVE_PDF_BREAKPOINT = 1100;

// For blur animation
const DRAG_HANDLE_WIDTH = 16;
const RESIZABLE_DEFAULT_WIDTH = 200;

const InstructionContainer = styled.div`
  gap: 32px;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const DescriptionBlock = styled.div`
  gap: 16px;
  display: flex;
  flex-direction: column;
`;

const Description = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Footer = styled.div<{ isSignUp: boolean }>`
  ${(props) => !props.isSignUp && 'display: flex;'}
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
  justify-content: ${(props) => (props.isSignUp ? '' : 'flex-end')};
`;

const NonInteractiveKeyCard = styled.div<{ loading: boolean }>`
  cursor: ${(props) => (props.loading ? '' : 'pointer')};
  pointer-events: ${(props) => (props.loading ? 'none' : '')};
`;

const InteractiveContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  position: absolute;
  top: 0;
  right: 0;
  height: 100vh;
  width: 50%;
  height: 100%;
  justify-content: center;
`;

const InteractiveKeyCard = styled.div`
  width: 300px;
  border: 1px solid var(--border-secondary);
  border-radius: 16px;
  box-shadow: var(--shadow-l2);
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow: hidden;
  position: relative;
`;

const BlurCard = styled(motion.div)`
  height: 500px;
  width: ${RESIZABLE_DEFAULT_WIDTH}px;
  background: rgba(255, 255, 255, 0.01);
  position: absolute;
  right: 0;
  top: 0;
  z-index: 999;
  backdrop-filter: blur(3px);
`;

const DragHandle = styled(motion.div)<{ width: string }>`
  position: absolute;
  cursor: col-resize;
  height: 100%;
  top: 0;
  right: 0;
  width: ${(props) => props.width};
  transition: background 0.2s;
  border-left: 1.5px solid var(--border-secondary);
  margin-right: ${RESIZABLE_DEFAULT_WIDTH + DRAG_HANDLE_WIDTH * 0.5 - 16}px;
  z-index: 9999;
  &:hover {
    border-color: var(--border-primary);
  }
  &:active {
    border-color: var(--icon-secondary);
  }
`;

const CardTitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const KeyTextBlock = styled.div`
  background: var(--bg-field-default);
  padding: 10px 16px;
  border-radius: 8px;
`;

const Spacer = styled.div<{ height?: number }>`
  height: ${(props) => props.height ?? 16}px;
  transition: all 0.3s;
`;

const PhraseContainer = styled.div`
  box-sizing: border-box;
  padding: 16px;
  border-radius: 12px;
  max-width: 448px;
  min-width: 112px;
  width: unset;
  background: var(--bg-field-default);
  margin: auto;
`;

type AccountRecoveryInstructionProps = {
  /** Is this being rendered as part of an onboarding flow? */
  isOnboarding?: boolean;
  /** Closes account recovery modal */
  onClose?: () => void;
  /** Downloads PDF */
  onDownloadPDF: () => Promise<void>;
  /** Recovery key */
  recoveryPaperShare: string;
  username?: string;
  /** Mobile keyboard height */
  keyboardHeight: number;
  /** Defined only if it's a workspace invite */
  decodedJWT?: DecodedJWT;
  /** From the 'email' QueryParam */
  backupEmail?: string;
  /** Function that adds the new backup email
   * Returns an error message if it fails
   * Only passed if the user is still signing up
   */
  runAddEmail?: (email: string) => Promise<string | undefined>;
  /** Function called after the PDF has been downloaded */
  onNext?: () => void;
  /** Function that accepts a workspace doc invite */
  acceptDocLinkInvite?: (arg: React.Dispatch<React.SetStateAction<boolean>>) => Promise<void>;
};
const CREATE_RECOVERY_NEXT_BTN_MARGIN = 120;

function AccountRecoveryInstruction({
  isOnboarding,
  onClose,
  onDownloadPDF,
  recoveryPaperShare,
  username,
  keyboardHeight,
  decodedJWT,
  backupEmail,
  runAddEmail,
  onNext
}: AccountRecoveryInstructionProps) {
  // Input field error
  const [error, setError] = useState('');
  // Value inside text field
  // If given a backup email (ie through an invite link), have it fill the text field on initial render
  const [addedEmail, setAddedEmail] = useState(backupEmail ?? decodedJWT?.email ?? '');
  // Changes copy tooltip based on whether user just copied
  const [copyTooltip, setCopyTooltip] = useState('Copy key');
  // Whether or not the key card has been clicked
  const [isCopyClicked, setIsCopyClicked] = useState(false);
  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  // If onClose is not defined, account recovery is not a modal and the user is still signing up.
  const isSignUp = !onClose;

  // For blur animation
  const x = useMotionValue(RESIZABLE_DEFAULT_WIDTH * 0.5);
  const blurWidth = useTransform(x, (x) => `${RESIZABLE_DEFAULT_WIDTH - x + 0.5 * DRAG_HANDLE_WIDTH}px`);

  // Abbreviated username
  const abbrUsername = formatName(username || '');
  // Show interactive key card if the window is wide enough on sign up
  const displayInteractiveKeyCard = useMediaQuery(`(min-width:${INTERACTIVE_PDF_BREAKPOINT}px)`) && isSignUp;

  // For mobile button positioning
  const nextRef = useRef<HTMLDivElement>(null);
  const generateSpacer = useAvoidIosKeyboard(nextRef, CREATE_RECOVERY_NEXT_BTN_MARGIN, keyboardHeight, (margin) => (
    <Spacer height={margin} />
  ));

  // Selects text and copies it to clipboard
  const copyToClipboard = () => {
    setIsCopyClicked(true);
    copyToClipboardWebAndMobile(recoveryPaperShare);
  };

  // Exports the recovery key component
  const downloadPDF = async () => {
    try {
      await onDownloadPDF();
    } catch (err) {
      console.log(err);
    }

    setTimeout(() => {
      setIsSubmitting(false);
    }, RECOVERY_KEY_WAIT_TIME);
  };

  const submit = async () => {
    setIsSubmitting(true);

    try {
      await downloadPDF();
      if (isOnboarding) {
        void storeWorkspaceEvent({
          variables: {
            request: {
              eventName: WorkspaceEventType.OnboardingRecoveryInstruction,
              data: JSON.stringify({
                keyDownloaded: true,
                hasRecoveryEmail: addedEmail && !error
              }),
              version: DEFAULT_WORKSPACE_EVENT_VERSION
            }
          }
        });
      }
    } catch (err) {
      console.log(err);
    }

    if (runAddEmail && addedEmail) {
      const errorMsg = await runAddEmail(addedEmail);
      if (!!errorMsg) {
        setError(errorMsg);
        setIsSubmitting(false);
      }
    }

    if (!!onNext) onNext();
  };

  const renderDescription = () => (
    <DescriptionBlock>
      {isSignUp && (
        <Description>
          <Icons color='secondary' icon={Icon.Envelope} />
          <Typography color='secondary' wrap>
            Add a backup email, for additional protection.
          </Typography>
        </Description>
      )}
      <Description>
        {isSignUp && <Icons color='secondary' icon={Icon.Key} />}
        <Typography color='secondary' wrap>
          Download one-time code. If you lose this code, we can&apos;t recover your account in case you forget your
          password.
        </Typography>
      </Description>
    </DescriptionBlock>
  );

  // Non-interactive key card component for account recovery modal
  // Render loader if recovery key hasn't been uploaded yet
  const renderNonInteractiveKeyCard = () => (
    <Tooltip>
      <TooltipContent>{copyTooltip}</TooltipContent>
      <TooltipTrigger>
        <NonInteractiveKeyCard
          loading={!recoveryPaperShare}
          onClick={() => void copyToClipboard()}
          onKeyDown={() => void copyToClipboard()}
          role='button'
          tabIndex={0}
        >
          <PhraseContainer>
            {recoveryPaperShare && (
              <Typography dataTest='recovery-key-text' wrap>
                {recoveryPaperShare}
              </Typography>
            )}
            {!recoveryPaperShare && (
              <RelativelyCentered>
                <CircularProgress size={Size.X_MEDIUM} spinner />
              </RelativelyCentered>
            )}
          </PhraseContainer>
        </NonInteractiveKeyCard>
      </TooltipTrigger>
    </Tooltip>
  );

  // Interactive key card for users who are still signing up
  const renderInteractiveKeyCard = () => (
    <InteractiveKeyCard>
      <BlurCard style={{ width: blurWidth }} />
      <DragHandle
        drag='x'
        dragConstraints={{
          left: -100,
          right: 100
        }}
        dragMomentum={false}
        style={{ x }}
        width={`${DRAG_HANDLE_WIDTH}px`}
      />
      <CardTitleSection>
        <Icons color='secondary' icon={Icon.Key} size={Size.X_LARGE} />
        <Typography size={TypographySize.H2} weight={TypographyWeight.BOLD} wrap>
          {abbrUsername}’s secret recovery key
        </Typography>
        <Typography color='secondary' size={TypographySize.H3} wrap>
          Download to recover account
        </Typography>
      </CardTitleSection>
      <KeyTextBlock>
        {recoveryPaperShare && (
          <Typography color='secondary' dataTest='recovery-key-text' wrap>
            {recoveryPaperShare}
          </Typography>
        )}
        {!recoveryPaperShare && (
          <RelativelyCentered>
            <CircularProgress size={Size.X_MEDIUM} spinner />
          </RelativelyCentered>
        )}
      </KeyTextBlock>
    </InteractiveKeyCard>
  );

  const renderFooter = () => {
    // The submit button takes up its full width during sign-up
    // The text on a full-width button changes to "Downloading..." on loading
    // If the button is not in full-width, the text is hidden during loading to prevent a layout shift
    const showDownloading = isSubmitting && isSignUp;
    const text = isSignUp ? 'Next' : 'Save key as PDF';
    return (
      <Footer isSignUp={isSignUp}>
        {!isSignUp && (
          <Button onClick={onClose} size={isMobile ? Size.LARGE : Size.MEDIUM} type={Type.SECONDARY}>
            Close
          </Button>
        )}
        <Button
          dataTest='enable-recovery'
          fullWidth={isSignUp}
          loading={showDownloading ? false : isSubmitting}
          onClick={() => void submit()}
          ref={nextRef}
          size={isMobile ? Size.LARGE : Size.MEDIUM}
        >
          {showDownloading ? 'Downloading...' : text}
        </Button>
        {isSignUp && (
          <>
            <Spacer />
            <Typography align={Alignment.CENTER} color='secondary' onClick={() => void submit()}>
              Download key only
            </Typography>
          </>
        )}
      </Footer>
    );
  };

  // Update tooltip if copy is clicked
  useEffect(() => {
    if (!isCopyClicked) return;
    setCopyTooltip('Copied.');
    setTimeout(() => {
      setCopyTooltip('Copy key');
      setIsCopyClicked(false);
    }, COPIED_DURATION);
  }, [isCopyClicked]);

  return (
    <>
      <InstructionContainer>
        {/* Instructions */}
        {renderDescription()}
        {/* Modal key card */}
        {!isSignUp && renderNonInteractiveKeyCard()}
        {/* Backup email input field */}
        {isSignUp && (
          <InputField
            autoFocus
            dataTest='backup-email-input'
            error={error}
            onChange={(evt: { target: { value: string } }) => {
              setAddedEmail(evt.target.value);
              if (!!error) setError('');
            }}
            onKeyDown={(evt: React.KeyboardEvent) => {
              if (evt.key === 'Enter') {
                evt.preventDefault();
                void submit();
              }
            }}
            placeholder='backup@email.com'
            value={addedEmail}
          />
        )}
        {isMobile && generateSpacer()}
        {renderFooter()}
      </InstructionContainer>
      {/* Interactive key card */}
      {displayInteractiveKeyCard && (
        <InteractiveContainer>
          {renderInteractiveKeyCard()}
          <Spacer height={8} />
          <div>
            <Button
              icon={<AnimatedCopyIcon isClicked={isCopyClicked} />}
              onClick={() => void copyToClipboard()}
              type={Type.SECONDARY}
            >
              {copyTooltip}
            </Button>
          </div>
        </InteractiveContainer>
      )}
    </>
  );
}

export default AccountRecoveryInstruction;
