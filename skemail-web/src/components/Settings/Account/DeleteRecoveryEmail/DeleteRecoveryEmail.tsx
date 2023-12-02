import React, { useState } from 'react';
import { isMobile } from 'react-device-detect';
import { GetUserEmailAndWalletDocument, useDeleteRecoveryEmailMutation } from 'skiff-front-graphql';
import {
  TitleActionSection,
  RecoveryEmailOptions,
  deleteCurrentUserRecoveryEmail,
  useRequiredCurrentUserData,
  useToast
} from 'skiff-front-utils';
import { SUPPORT_EMAIL } from 'skiff-utils';

import ConfirmPasswordDialog from '../../../shared/ConfirmPasswordDialog';

/**
 * Component for rendering the interface to change an email address.
 */
function DeleteRecoveryEmail() {
  const { recoveryEmail, userID } = useRequiredCurrentUserData();

  const { enqueueToast } = useToast();
  // State for toggling re-auth modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
  const [deleteRecoveryEmail] = useDeleteRecoveryEmailMutation({
    onError: () =>
      enqueueToast({
        title: 'Could not delete recovery email',
        body: `There was an error deleting your recovery email. Please try refreshing and contact ${SUPPORT_EMAIL} if this issue persists.`
      }),
    onCompleted: () => {
      enqueueToast({
        title: 'Successfully deleted recovery email',
        body: 'Your recovery email was successfully deleted.'
      });
    },
    refetchQueries: [{ query: GetUserEmailAndWalletDocument, variables: { request: { userID } } }]
  });

  const startDeleteRecoveryEmail = async () => {
    setShowConfirmModal(false);
    const { data } = await deleteRecoveryEmail({ variables: {} });

    if (data?.deleteRecoveryEmail) {
      deleteCurrentUserRecoveryEmail();
    }
    return true;
  };

  const onDelete = () => {
    setShowConfirmModal(true);
  };

  return (
    <>
      <ConfirmPasswordDialog
        description='Deleting your recovery email address will make it difficult to recover your account in case you forget your password.'
        handleSubmit={startDeleteRecoveryEmail}
        onClose={() => setShowConfirmModal(false)}
        open={showConfirmModal}
      />
      <TitleActionSection
        actions={[
          {
            content: <RecoveryEmailOptions onDelete={onDelete} recoveryEmail={recoveryEmail || ''} />,
            type: 'custom'
          }
        ]}
        animate
        column={isMobile}
        subtitle='This is the email used to recover your account'
        title='Recovery email address'
      />
    </>
  );
}

export default DeleteRecoveryEmail;
