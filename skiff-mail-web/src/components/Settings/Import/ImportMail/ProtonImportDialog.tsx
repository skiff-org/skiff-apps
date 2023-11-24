import { Button, Dialog, Type, Typography } from 'nightwatch-ui';
import styled from 'styled-components';

interface ProtonImportDialogProps {
  open: boolean;
  onClose: () => void | Promise<void>;
  setUploadMboxFilesOpen: (open: boolean) => void;
  setUploadEmlFilesOpen: (open: boolean) => void;
}

const ButtonContainer = styled.div`
  display: flex;
  gap: 8px;
`;

export const ProtonImportDialog: React.FC<ProtonImportDialogProps> = ({
  open,
  onClose,
  setUploadMboxFilesOpen,
  setUploadEmlFilesOpen
}: ProtonImportDialogProps) => {
  return (
    <Dialog customContent hideCloseButton onClose={() => void onClose()} open={open} title='Import from ProtonMail'>
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
            setUploadMboxFilesOpen(true);
            void onClose();
          }}
          type={Type.SECONDARY}
        >
          MBOX import
        </Button>
        <Button
          onClick={() => {
            setUploadEmlFilesOpen(true);
            void onClose();
          }}
          type={Type.SECONDARY}
        >
          EML import
        </Button>
      </ButtonContainer>
    </Dialog>
  );
};
