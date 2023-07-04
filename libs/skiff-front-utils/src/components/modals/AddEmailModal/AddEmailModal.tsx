import { ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, InputField, Layout, ThemeMode } from '@skiff-org/skiff-ui';
import Drawer from '../../Drawer';
import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { RequestStatus } from 'skiff-graphql';
import styled from 'styled-components';

const MobileButtonContainer = styled.div`
  margin-top: 16px;
`;

type AddEmailModalProps = {
  /** Closes the dialog */
  closeDialog: () => void;
  /** Error message */
  error: string;
  /** Whether email is being added */
  loading: boolean;
  /** Sends the confirmation email to the added backup email */
  runAddEmail: (email: string) => Promise<RequestStatus | undefined>;
  /** Error message setter */
  setError: (error: string) => void;
  /** Invoked when the confirmation email is sent successfully */
  onSendSuccess?: (email: string) => void;
};

/**
 * Component for rendering the interface to add a back-up email address.
 */
function AddEmailModal({ closeDialog, error, loading, runAddEmail, setError, onSendSuccess }: AddEmailModalProps) {
  // Text content inside text field
  const [email, setEmail] = useState('');

  const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(evt.target.value);
    // Reset error when text input changes
    if (!!error) setError('');
  };

  const onClose = () => {
    closeDialog();
    // Reset
    setError('');
    setEmail('');
  };

  const addEmail = async () => {
    // Return an error if the text field is empty
    if (!email.length) {
      setError('No email added');
      return;
    }
    const status = await runAddEmail(email);
    const success = status === RequestStatus.Success && !error.length;
    if (success) {
      onSendSuccess?.(email);
      onClose();
    } else {
      setError(!!error.length ? error : 'Could not add email');
    }
  };

  const renderAddEmailInput = (forceTheme?: ThemeMode) => (
    <InputField
      autoFocus
      disabled={loading}
      error={!!error}
      errorMsg={error}
      forceTheme={forceTheme}
      onChange={onChange}
      onKeyPress={(e: React.KeyboardEvent) => {
        if (e.key === 'Enter') void addEmail();
      }}
      placeholder='Email address'
      value={email}
    />
  );
  const renderAddEmailButtons = (forceTheme?: ThemeMode) => (
    <ButtonGroup fullWidth layout={isMobile ? Layout.STACKED : Layout.INLINE}>
      <ButtonGroupItem
        forceTheme={forceTheme}
        key='submit'
        label='Send confirmation'
        loading={loading}
        onClick={() => void addEmail()}
      />
      <ButtonGroupItem forceTheme={forceTheme} key='cancel' label='Cancel' onClick={onClose} />
    </ButtonGroup>
  );

  return isMobile ? (
    <Drawer hideDrawer={onClose} scrollable show showClose>
      {renderAddEmailInput(ThemeMode.DARK)}
      <MobileButtonContainer className='mobile-avoiding-keyboard'>
        {renderAddEmailButtons(ThemeMode.DARK)}
      </MobileButtonContainer>
    </Drawer>
  ) : (
    <Dialog
      customContent
      hideCloseButton={loading}
      inputField={renderAddEmailInput()}
      onClose={onClose}
      open
      title='Add email address'
      type={DialogTypes.Input}
    >
      {renderAddEmailButtons()}
    </Dialog>
  );
}

export default AddEmailModal;
