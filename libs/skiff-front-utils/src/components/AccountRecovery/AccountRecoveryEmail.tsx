import { Button, InputField, Size } from '@skiff-org/skiff-ui';
import React, { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useStoreWorkspaceEventMutation } from 'skiff-front-graphql';
import { WorkspaceEventType } from 'skiff-graphql';

import { DEFAULT_WORKSPACE_EVENT_VERSION } from '../../constants';
import { useAvoidIosKeyboard } from '../../hooks';
import { DecodedJWT } from '../../utils/loginUtils';
import ConfirmModal from '../modals/ConfirmModal';

import { InstructionContainer, Footer, Spacer } from './AccountRecoveryKey';

type AccountRecoveryEmailProps = {
  /** Closes account recovery modal */
  onClose?: () => void;

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
  /** Function called after recovery email has been entered/ skipped */
  onNext?: () => void;
  /** Function that accepts a workspace doc invite */
  acceptDocLinkInvite?: (arg: React.Dispatch<React.SetStateAction<boolean>>) => Promise<void>;
};
const CREATE_RECOVERY_NEXT_BTN_MARGIN = 120;

function AccountRecoveryEmail({
  onClose,
  keyboardHeight,
  decodedJWT,
  backupEmail,
  runAddEmail,
  onNext
}: AccountRecoveryEmailProps) {
  // Input field error
  const [error, setError] = useState('');
  // Value inside text field
  // If given a backup email (ie through an invite link), have it fill the text field on initial render
  const [addedEmail, setAddedEmail] = useState(backupEmail ?? decodedJWT?.email ?? '');

  // Loading state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If onClose is not defined, account recovery is not a modal and the user is still signing up.
  const isSignUp = !onClose;

  const [showMissingEmailModal, setShowMissingEmailModal] = useState(false);

  const [storeWorkspaceEvent] = useStoreWorkspaceEventMutation();

  // For mobile button positioning
  const nextRef = useRef<HTMLDivElement>(null);
  const generateSpacer = useAvoidIosKeyboard(nextRef, CREATE_RECOVERY_NEXT_BTN_MARGIN, keyboardHeight, (margin) => (
    <Spacer height={margin} />
  ));

  const onSubmit = async () => {
    // Submit if recovery email has been specified
    if (addedEmail) {
      setIsSubmitting(true);
      if (!runAddEmail || !addedEmail) {
        return;
      }

      const errorMsg = await runAddEmail(addedEmail);
      if (!!errorMsg) {
        setError(errorMsg);
        setIsSubmitting(false);
        return;
      }
    } else {
      // Ask user to confirm missing recovery email
      setShowMissingEmailModal(true);
      return;
    }

    await storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.OnboardingSetRecoveryEmail,
          data: JSON.stringify({ hasRecoveryEmail: addedEmail && !error }),
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });

    if (!!onNext) onNext();
  };

  const onConfirm = async () => {
    // If the missing email modal is showing, then user is choosing to continue
    // without adding a recovery email
    setShowMissingEmailModal(false);

    await storeWorkspaceEvent({
      variables: {
        request: {
          eventName: WorkspaceEventType.OnboardingSetRecoveryEmail,
          data: JSON.stringify({ hasRecoveryEmail: false }),
          version: DEFAULT_WORKSPACE_EVENT_VERSION
        }
      }
    });

    if (!!onNext) onNext();
  };

  const renderFooter = () => {
    // The submit button takes up its full width during sign-up
    // The text on a full-width button changes to "Downloading..." on loading
    // If the button is not in full-width, the text is hidden during loading to prevent a layout shift
    return (
      <Footer isSignUp={isSignUp}>
        {isSignUp && (
          <Button
            dataTest='set-recovery-email-button'
            fullWidth={isSignUp}
            loading={isSubmitting}
            onClick={onSubmit}
            size={isMobile ? Size.LARGE : Size.MEDIUM}
          >
            Continue
          </Button>
        )}
        {showMissingEmailModal && (
          <ConfirmModal
            confirmName='Ignore'
            description={`You did not set a recovery email so account recovery is more difficult if you forget your password.`}
            destructive
            onClose={() => setShowMissingEmailModal(false)}
            onConfirm={() => onConfirm()}
            onSecondary={() => setShowMissingEmailModal(false)}
            open={showMissingEmailModal}
            secondaryName='Go back'
            title='Warning'
          />
        )}
      </Footer>
    );
  };

  return (
    <>
      <InstructionContainer>
        {/* Backup email input field */}
        {isSignUp && (
          <InputField
            autoFocus
            dataTest='backup-email-input'
            errorMsg={error}
            onChange={(evt: { target: { value: string } }) => {
              setAddedEmail(evt.target.value);
              if (!!error) setError('');
            }}
            onKeyDown={(evt: React.KeyboardEvent) => {
              if (evt.key === 'Enter') {
                evt.preventDefault();
                void onSubmit();
              }
            }}
            placeholder='backup@email.com'
            value={addedEmail}
          />
        )}
        {isMobile && generateSpacer()}
        {renderFooter()}
      </InstructionContainer>
    </>
  );
}

export default AccountRecoveryEmail;
