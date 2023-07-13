import { ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, Type, Typography } from '@skiff-org/skiff-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import { ThreadFragment, useGetThreadFromIdQuery } from 'skiff-front-graphql';
import { SystemLabels } from 'skiff-graphql';

import { NO_SUBJECT_TEXT } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { getEmailBody } from '../MailEditor/mailEditorUtils';

interface UnSendModalProps {
  threadID: string;
}

const UnSendModal: React.FC<UnSendModalProps> = ({ threadID }: UnSendModalProps) => {
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const { data, loading: isThreadDataLoading } = useGetThreadFromIdQuery({ variables: { threadID } });
  const thread = data?.userThread || undefined;

  const { composeNewDraft, saveComposeDraft } = useDrafts();
  const dispatch = useDispatch();

  const { unscheduleSend } = useThreadActions();

  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const unSendMessage = async () => {
    if (isThreadDataLoading || !thread) return;
    const scheduledMessage = thread.emails.at(-1);
    if (!scheduledMessage) return;

    await unscheduleSend(thread.threadID, scheduledMessage.id);

    // save as draft
    const currentDraftID = composeNewDraft();
    if (!currentDraftID) return;
    void saveComposeDraft({
      draftID: currentDraftID,
      subject: scheduledMessage.decryptedSubject || NO_SUBJECT_TEXT,
      text: getEmailBody(scheduledMessage),
      toAddresses: scheduledMessage.to,
      ccAddresses: scheduledMessage.cc,
      bccAddresses: scheduledMessage.bcc,
      fromAddress: scheduledMessage.from.address,
      existingThread: {
        ...thread,
        // remove scheduleSendAt from emails in thread;
        // remove the soon-to-be draft email from the thread,
        // because the existingThread argument represents the thread to which the draft
        // will ultimately be added when it is sent, excluding the draft itself
        emails: thread.emails
          .filter((email) => email.id !== scheduledMessage.id)
          .map((email) => ({ ...email, scheduleSendAt: undefined })),
        // set label to drafts
        attributes: { ...thread.attributes, systemLabels: [SystemLabels.Drafts] }
      } as ThreadFragment
    });

    onClose();
  };

  return (
    <Dialog
      customContent
      onClose={onClose}
      open={openSharedModal?.type === ModalType.UnSendMessage}
      title="Don't send?"
      type={DialogTypes.Confirm}
    >
      <Typography>This message will be converted back to draft.</Typography>
      <ButtonGroup>
        <ButtonGroupItem
          label='Unschedule'
          loading={isThreadDataLoading}
          onClick={unSendMessage}
          type={Type.DESTRUCTIVE}
        />
        <ButtonGroupItem label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};

export default UnSendModal;
