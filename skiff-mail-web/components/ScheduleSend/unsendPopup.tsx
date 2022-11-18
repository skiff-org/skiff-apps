import { ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, Typography } from 'nightwatch-ui';
import React from 'react';
import { useDispatch } from 'react-redux';
import { SystemLabels } from 'skiff-graphql';
import { ThreadFragment } from 'skiff-mail-graphql';

import { NO_SUBJECT_TEXT } from '../../constants/mailbox.constants';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useDrafts } from '../../hooks/useDrafts';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { isUnSendModal, ModalType } from '../../redux/reducers/modalTypes';

const UnSendModal = () => {
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const { composeNewDraft, saveCurrentDraft } = useDrafts();
  const dispatch = useDispatch();

  const { unscheduleSend } = useThreadActions();

  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const unSendMessage = async () => {
    if (!isUnSendModal(openSharedModal)) return;

    const { thread } = openSharedModal;
    const scheduledMessage = thread.emails.at(-1);
    if (!scheduledMessage) return;

    await unscheduleSend(thread.threadID, scheduledMessage.id);

    // save as draft
    composeNewDraft();
    await saveCurrentDraft(
      scheduledMessage.decryptedSubject || NO_SUBJECT_TEXT,
      scheduledMessage.decryptedHtml || '',
      scheduledMessage.to,
      scheduledMessage.cc,
      scheduledMessage.bcc,
      {
        ...thread,
        // remove scheduleSendAt from drafts
        emails: thread.emails.map((email) => ({ ...email, scheduleSendAt: undefined })),
        // set label to drafts
        attributes: { ...thread.attributes, systemLabels: [SystemLabels.Drafts] }
      } as ThreadFragment
    );

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
        <ButtonGroupItem destructive key='unsend' label='Unschedule' onClick={unSendMessage} />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};

export default UnSendModal;
