import { Button, Dialog, Type, Typography } from 'nightwatch-ui';
import { MutableRefObject } from 'react';
import styled from 'styled-components';

type ProtonImportDialogProps = {
  open: boolean;
  onClose: () => void | Promise<void>;
  mboxRef: MutableRefObject<HTMLInputElement | null>;
  emlRef: MutableRefObject<HTMLInputElement | null>;
};

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const ProtonImportDialog = (props: ProtonImportDialogProps) => {
  const { open, onClose, mboxRef, emlRef } = props;
  return (
    <Dialog customContent onClose={() => void onClose()} open={open} title='Import from ProtonMail'>
      <Typography wrap>
        To import from ProtonMail, use the Import/Export app and export an EML file or MBOX file. Then, choose the file
        below to import emails into Skiff.
      </Typography>
      <Typography wrap>
        For more information, visit{' '}
        <a href='https://proton.me/support/export-emails-import-export-app' rel='noopener noreferrer' target='_blank'>
          this link
        </a>
        .
      </Typography>
      <ButtonContainer>
        <Button
          onClick={() => {
            mboxRef.current?.click();
          }}
          type={Type.SECONDARY}
        >
          MBOX import
        </Button>
        <Button
          onClick={() => {
            emlRef.current?.click();
          }}
          type={Type.SECONDARY}
        >
          EML import
        </Button>
      </ButtonContainer>
    </Dialog>
  );
};
