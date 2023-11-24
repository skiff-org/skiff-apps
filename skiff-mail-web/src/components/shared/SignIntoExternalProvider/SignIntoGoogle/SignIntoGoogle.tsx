import { Icon } from 'nightwatch-ui';
import { GoogleLoginButton } from 'skiff-front-utils';

import { SignIntoExternalProvider, SignIntoExternalProviderModalProps } from '../SignIntoExternalProvider';

interface SignIntoGoogleModalProps
  extends Pick<SignIntoExternalProviderModalProps, 'open' | 'onClose' | 'actionLabel'> {
  handleGoogleAuth: () => Promise<void>;
}

export const SignIntoGoogle: React.FC<SignIntoGoogleModalProps> = ({
  open,
  onClose,
  handleGoogleAuth,
  actionLabel
}: SignIntoGoogleModalProps) => {
  return (
    <SignIntoExternalProvider
      actionLabel={actionLabel}
      authButton={<GoogleLoginButton onClick={handleGoogleAuth} />}
      onClose={onClose}
      open={open}
      providerIcon={Icon.Gmail}
      providerLabel='Google'
    />
  );
};
