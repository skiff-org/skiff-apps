import { ButtonGroupItem, Dialog, DialogType } from 'nightwatch-ui';
import { useDispatch } from 'react-redux';
import {
  GetThreadFromIdDocument,
  useSilenceMultipleEmailAddressesMutation,
  useUnblockEmailAddressMutation
} from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useThreadActions } from '../../hooks/useThreadActions';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { BlockUnblockSenderType, ModalType } from '../../redux/reducers/modalTypes';

export const BlockUnblockSenderModal = () => {
  const { openModal } = useAppSelector((state) => state.modal);

  const dispatch = useDispatch();
  const onClose = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const { enqueueToast } = useToast();
  const { activeThreadID } = useThreadActions();

  const [blockEmailAddress] = useSilenceMultipleEmailAddressesMutation();
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
    if (isBlockSender) {
      return `Silence ${senderDisplayName ?? ''}?`;
    }
    if (isUnblockSender) {
      return `Unsilence ${senderDisplayName ?? ''}?`;
    }
    return '';
  };

  const getDescription = (): string | undefined => {
    if (isBlockSender) {
      return `All future messages from ${senderDisplayName} will be blocked.`;
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
          emailAddressesToSilence: [emailAddressToBlock]
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
      },
      refetchQueries: activeThreadID
        ? [{ query: GetThreadFromIdDocument, variables: { threadID: activeThreadID } }]
        : undefined
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
      enqueueToast({ title: `${senderDisplayName} ${isBlockSender ? 'was silenced' : 'was unsilenced'}.` });
    } catch (error) {
      console.log(error);
      enqueueToast({
        title: `Failed to ${isBlockSender ? 'silence' : 'unsilence'}`,
        body: `Could not ${isBlockSender ? 'silence' : 'unsilence'} ${senderDisplayName}. Please try again.`
      });
    }
  };

  return (
    <Dialog description={getDescription()} onClose={onClose} open={open} title={getTitle()} type={DialogType.CONFIRM}>
      <ButtonGroupItem key='report' label={isBlockSender ? 'Silence' : 'Unsilence'} onClick={onBlockUnblockClick} />
      <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
    </Dialog>
  );
};

export default BlockUnblockSenderModal;
