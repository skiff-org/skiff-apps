import { Typography, useOnClickOutside } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import { isWalletAddress } from 'skiff-front-utils';
import { TitleActionSection, SettingAction } from 'skiff-front-utils';
import { RequestStatus } from 'skiff-graphql';
import { useChangeEmailMutation, useGetCurrentUserEmailAliasesQuery } from 'skiff-mail-graphql';
import { insertIf } from 'skiff-utils';

import { useRequiredCurrentUserData } from '../../../../apollo/currentUser';
import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

/**
 * Component for rendering the interface to change an email address.
 */
function ChangeEmail() {
  const { username, email } = useRequiredCurrentUserData();
  /** Text content inside text field */
  const [emailStateField, setEmailStateField] = useState(email ?? username);
  /** Whether change email process has started successfully */
  const [changeStarted, setChangeStarted] = useState(false);
  // Change email error
  const [error, setError] = useState('');
  // State for toggling re-auth modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const [changeEmail] = useChangeEmailMutation({ onError: (e) => setError(e.message) });
  const { data } = useGetCurrentUserEmailAliasesQuery();
  const hasEmailAliases = !!data?.currentUser?.emailAliases?.length;

  const reset = () => {
    setError('');
    setChangeStarted(false);
    setEmailStateField(email ?? username);
  };

  useOnClickOutside(
    inputRef,
    () => {
      reset();
      setFocused(false);
    },
    undefined,
    {
      web: 'click'
    },
    [buttonRef],
    !focused
  );
  const blur = () => {
    if (inputRef?.current) inputRef.current.blur();
  };

  /**
   * Start the flow to change a user's username/email.
   */
  const startChangeEmail = async () => {
    const { data } = await changeEmail({ variables: { request: { newEmail: emailStateField } } });
    blur();
    const requestFailed = data?.changeEmail.status !== RequestStatus.Success || !!error;
    // if request successful, set that change started to show instructional text
    if (!requestFailed) {
      setChangeStarted(true);
    }
    return !requestFailed;
  };

  // If we have a wallet address, backup email is not set, or we have
  // email aliases associated with out account, we call it 'Recovery email'.
  // Else for non-wallet addresses with email set, we call it 'Login email'
  const label =
    email && !isWalletAddress(username) && !hasEmailAliases ? 'Login email address' : 'Recovery email address';

  return (
    <>
      <ConfirmPasswordDialog
        handleSubmit={startChangeEmail}
        onClose={() => setShowConfirmModal(false)}
        open={showConfirmModal}
      />
      <TitleActionSection
        actions={[
          {
            innerRef: inputRef,
            onChange: (evt: { target: { value: string } }) => setEmailStateField(evt.target.value),
            onFocus: () => {
              reset();
              setFocused(true);
            },
            onKeyDown: (evt: React.KeyboardEvent) => {
              if (evt.key === 'Enter') {
                setShowConfirmModal(true);
              }
            },
            value: emailStateField,
            type: 'input'
          },
          ...insertIf<SettingAction>((email ?? username) !== emailStateField, {
            onClick: () => setShowConfirmModal(true),
            label: 'Save',
            type: 'button',
            ref: buttonRef
          })
        ]}
        animate
        subtitle='This is the email used to recover your account.'
        title={label}
      />
      {error && (
        <Typography color='destructive' type='label'>
          Unable to send verification email
        </Typography>
      )}
      {changeStarted && (
        <Typography type='label' wrap>
          Email change started. First, click the link sent to&nbsp;
          {username}. Then, click the link sent to&nbsp;
          {emailStateField}.
        </Typography>
      )}
    </>
  );
}

export default ChangeEmail;
