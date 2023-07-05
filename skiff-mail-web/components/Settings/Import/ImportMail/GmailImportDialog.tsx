import { Button, Dialog, Type } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { GoogleLoginButton, Illustration, Illustrations } from 'skiff-front-utils';
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

type GmailImportDialogProps = {
  open: boolean;
  onClose: () => void | Promise<void>;
  handleGmailAuth: () => void | Promise<void>;
};

export const GmailImportDialog = (props: GmailImportDialogProps) => {
  const { open, onClose, handleGmailAuth } = props;
  return (
    <Dialog
      customContent
      description='Securely import email and contacts from Gmail.'
      onClose={() => void onClose()}
      open={open}
      title='Connect Gmail'
    >
      <Illustration illustration={Illustrations.MigrateMail} style={{ marginLeft: isMobile ? '-70px' : undefined }} />
      <ButtonGroup>
        <GoogleLoginButton onClick={handleGmailAuth} style={{ cursor: 'pointer', height: 42 }} />
        <Button fullWidth onClick={() => void onClose()} type={Type.SECONDARY}>
          Cancel
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
