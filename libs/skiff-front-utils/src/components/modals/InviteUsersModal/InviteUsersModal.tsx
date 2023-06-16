import { ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, Icon, Icons, InputField } from 'nightwatch-ui';
import { AddressObject, DisplayPictureData } from 'skiff-graphql';

import { useToast } from '../../../hooks';
import { copyToClipboardWebAndMobile } from '../../../utils';

export interface InviteModalProps {
  onClose: () => void;
  isOpen: boolean;
  contactsList: AddressObject[];
  sendReferralLink: (email: string) => Promise<void>;
  referralLink: string;
  useDisplayPictureDataFromAddress: (contact: AddressObject) => DisplayPictureData | undefined | null;
}

const InviteUsersModal = ({ onClose, isOpen, referralLink }: InviteModalProps) => {
  const { enqueueToast } = useToast();

  const copyReferralLink = () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    copyToClipboardWebAndMobile(referralLink);
    enqueueToast({
      title: 'Referral link copied',
      body: `Share this link with friends to receive credits.`
    });
  };

  return (
    <Dialog
      customContent
      hideCloseButton
      onClose={onClose}
      open={isOpen}
      title='Share referral link'
      description='Earn $10 of credit when you refer a friend to signup for Skiff'
      type={DialogTypes.Confirm}
    >
      <InputField
        endAdornment={<Icons color='secondary' icon={Icon.Copy} onClick={copyReferralLink} />}
        value={referralLink}
      />
      <ButtonGroup>
        <ButtonGroupItem label='Copy link' onClick={copyReferralLink} />
        <ButtonGroupItem label='Close' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};
export default InviteUsersModal;
