import { Alignment, Button, Dialog, Type, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import { GoogleLoginButton, Illustration, Illustrations, useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

const ButtonGroup = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
`;

const IllustrationAndHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  padding: 12px;
  box-sizing: border-box;
`;

const IllustrationContainer = styled.div`
  display: flex;
  width: 100%;
  justify-content: center;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
`;

interface SignIntoGmailModalProps {
  open: boolean;
  onClose: () => void;
  handleGmailAuth: () => Promise<void>;
  actionLabel: string;
}

export const SignIntoGmailModal: React.FC<SignIntoGmailModalProps> = ({
  open,
  onClose,
  handleGmailAuth,
  actionLabel
}: SignIntoGmailModalProps) => {
  const { theme } = useTheme();
  return (
    <Dialog customContent hideCloseButton onClose={() => void onClose()} open={open}>
      <IllustrationAndHeader>
        <IllustrationContainer>
          <Illustration illustration={Illustrations.ConnectGmail} theme={theme} />
        </IllustrationContainer>
        <Header>
          <Typography mono uppercase align={Alignment.CENTER} size={TypographySize.H4} weight={TypographyWeight.MEDIUM}>
            {actionLabel} your Gmail messages to Skiff
          </Typography>
          <Typography mono uppercase align={Alignment.CENTER} color='secondary' size={TypographySize.MEDIUM}>
            You will be directed to sign in with Google
          </Typography>
        </Header>
      </IllustrationAndHeader>
      <ButtonGroup>
        <GoogleLoginButton onClick={handleGmailAuth} />
        <Button fullWidth onClick={() => void onClose()} type={Type.SECONDARY}>
          Cancel
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
