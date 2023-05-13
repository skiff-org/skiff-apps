import { Button, Dialog, ThemeMode, Type } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { GoogleLoginButton, useTheme } from 'skiff-front-utils';
import styled from 'styled-components';

import Illustration, { Illustrations } from '../../../../svgs/Illustration';

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
  const { theme } = useTheme();
  return (
    <Dialog
      customContent
      description='Securely import email and contacts from Gmail.'
      onClose={() => void onClose()}
      open={open}
      title='Connect Gmail'
    >
      <Illustration
        illustration={theme === ThemeMode.DARK ? Illustrations.DarkMigrate : Illustrations.LightMigrate}
        style={{ marginLeft: isMobile ? '-70px' : undefined }}
      />
      <ButtonGroup>
        <GoogleLoginButton onClick={handleGmailAuth} style={{ cursor: 'pointer', height: 42 }} />
        <Button fullWidth onClick={() => void onClose()} type={Type.SECONDARY}>
          Cancel
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};
