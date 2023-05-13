import { ButtonGroupItem, Dialog, DialogTypes } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import { useBlockEmailAddressMutation, useUnblockEmailAddressMutation } from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { BlockUnblockSenderType, ModalType } from '../../redux/reducers/modalTypes';

export const BlockUnblockSenderModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const { enqueueToast } = useToast();

  const [blockEmailAddress] = useBlockEmailAddressMutation();
  const [unblockEmailAddress] = useUnblockEmailAddressMutation();

  const open = openModal?.type === ModalType.BlockUnblockSender;
  const from = open ? openModal.from : undefined;
  const senderDisplayName = from ? from.name || from.address : '';
  const isBlockSender = open && openModal.action === BlockUnblockSenderType.Block;
  const isUnblockSender = open && openModal.action === BlockUnblockSenderType.Unblock;

  const getTitle = () => {
    if (!senderDisplayName) {
      return '';
    }
    const sender = senderDisplayName.split(' ')[0];
    if (isBlockSender) {
      return `Block ${sender ?? ''}?`;
    }
    if (isUnblockSender) {
      return `Unblock ${sender ?? ''}?`;
    }
    return '';
  };

  const getDescription = (): string | undefined => {
    if (isBlockSender) {
      return `All future messages from ${senderDisplayName} will go to Spam.`;
    }
    if (isUnblockSender) {
      return `All future messages from ${senderDisplayName} will go to Inbox.`;
    }
    return '';
  };

  const blockSender = async (emailAddressToBlock: string) => {
    await blockEmailAddress({
      variables: {
        request: {
          emailAddressToBlock
        }
      }
    });
  };

  const unblockSender = async (emailAddressToUnblock: string) => {
    await unblockEmailAddress({
      variables: {
        request: {
          emailAddressToUnblock
        }
      }
    });
  };

  const onBlockUnblockClick = async () => {
    // Check that from is defined
    if (!from) {
      console.error('Could not block/unblock sender as there was no sender given.');
      onClose();
      return;
    }
    try {
      onClose();
      if (isBlockSender) {
        await blockSender(from.address);
      } else {
        await unblockSender(from.address);
      }
      enqueueToast({ title: `${senderDisplayName} ${isBlockSender ? 'blocked' : 'unblocked'}.` });
    } catch (error) {
      console.log(error);
      enqueueToast({
        title: 'Failed to block',
        body: `Could not ${isBlockSender ? 'block' : 'unblock'} ${senderDisplayName}. Please try again.`
      });
    }
  };

  return (
    <Dialog description={getDescription()} onClose={onClose} open={open} title={getTitle()} type={DialogTypes.Confirm}>
      <ButtonGroupItem key='report' label={isBlockSender ? 'Block' : 'Unblock'} onClick={onBlockUnblockClick} />
      <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
    </Dialog>
  );
};

export default BlockUnblockSenderModal;
