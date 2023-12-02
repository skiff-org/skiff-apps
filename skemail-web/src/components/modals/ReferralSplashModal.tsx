import { ButtonGroupItem, Dialog, DialogType } from 'nightwatch-ui';
import { FC } from 'react';

export interface ReferralSplashModalProps {
  creditBytes: number;
  referralCount: number;
  onClose: () => void;
  onClick: () => void;
  isOpen: boolean;
}

export const ReferralSplashModal: FC<ReferralSplashModalProps> = ({
  isOpen,
  onClose,
  onClick,
  creditBytes,
  referralCount
}) => {
  const formattedCreditBytes =
    creditBytes >= 1_000_000_000
      ? (creditBytes / 1_000_000_000).toFixed(1) + 'GB'
      : (creditBytes / 1_000_000).toFixed(0) + 'MB';
  return (
    <Dialog
      description={`You earned additional ${formattedCreditBytes} of free storage for referring ${referralCount} friends to Skiff. Thanks for promoting privacy.`}
      onClose={onClose}
      open={isOpen}
      title={'Congrats! You earned ' + formattedCreditBytes + '.'}
      type={DialogType.PROMOTIONAL}
    >
      <ButtonGroupItem key='skemail-referral-confirm' label='Earn more' onClick={onClick} />
    </Dialog>
  );
};

export default ReferralSplashModal;
