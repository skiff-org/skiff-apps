import { Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TitleActionSection, useToast } from 'skiff-front-utils';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';

interface AddEmailProps {
  unverifiedRecoveryEmail: string | null | undefined;
}

/**
 * Component for rendering the interface to add an email address.
 */
const AddEmail: React.FC<AddEmailProps> = ({ unverifiedRecoveryEmail }) => {
  // State handling the currently recovery email pending verification
  const { enqueueToast } = useToast();
  const dispatch = useDispatch();

  const [unverifiedEmail, setUnverifiedEmail] = useState(unverifiedRecoveryEmail);

  const onSendSuccess = (email: string) => {
    setUnverifiedEmail(email);
    enqueueToast({
      title: 'Confirmation email sent',
      body: 'Click the link sent to the recovery email to confirm it.'
    });
  };

  const openAddEmailModal = () => {
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.AddEmail,
        onSendSuccess
      })
    );
  };

  return (
    <>
      <TitleActionSection
        actions={[
          {
            onClick: openAddEmailModal,
            label: 'Add',
            type: 'button'
          }
        ]}
        subtitle='This is the email used to recover your account'
        title='Recovery email address'
      />
      {unverifiedEmail && (
        <Typography mono uppercase weight={TypographyWeight.MEDIUM}>
          Confirmation email sent to {unverifiedEmail}. Click the link in this email to confirm.
        </Typography>
      )}
    </>
  );
};

export default AddEmail;
