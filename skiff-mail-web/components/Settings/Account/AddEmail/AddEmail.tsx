import { Typography } from 'nightwatch-ui';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { TitleActionSection } from 'skiff-front-utils';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';

/**
 * Component for rendering the interface to add an email address.
 */
function AddEmail() {
  // State handling whether an email was successfully sent
  const [emailSent, setEmailSent] = useState(false);

  const dispatch = useDispatch();
  const onSendSuccess = () => setEmailSent(true);
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
        subtitle='This is the email used to recover your account.'
        title='Recovery email address'
      />
      {emailSent && <Typography type='label'>Email sent. Click the link in email to confirm.</Typography>}
    </>
  );
}

export default AddEmail;
