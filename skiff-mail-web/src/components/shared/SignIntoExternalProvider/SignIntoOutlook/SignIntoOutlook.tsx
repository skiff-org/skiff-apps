import { Button, Icon, Size, ThemeMode } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';

import { SignIntoExternalProvider, SignIntoExternalProviderModalProps } from '../SignIntoExternalProvider';

interface SignIntoOutlookModalProps
  extends Pick<SignIntoExternalProviderModalProps, 'open' | 'onClose' | 'actionLabel'> {
  handleOutlookAuth: () => Promise<void>;
}

export const SignIntoOutlook: React.FC<SignIntoOutlookModalProps> = ({
  open,
  onClose,
  handleOutlookAuth,
  actionLabel
}: SignIntoOutlookModalProps) => {
  return (
    <SignIntoExternalProvider
      actionLabel={actionLabel}
      authButton={
        <Button
          forceTheme={isMobile ? ThemeMode.DARK : undefined}
          fullWidth
          onClick={handleOutlookAuth}
          size={isMobile ? Size.LARGE : undefined}
        >
          Sign in with Outlook
        </Button>
      }
      onClose={onClose}
      open={open}
      providerIcon={Icon.Outlook}
      providerLabel='Outlook'
    />
  );
};
