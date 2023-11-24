import { ApolloError } from '@apollo/client';
import { Icon } from 'nightwatch-ui';
import { useState } from 'react';
import { ImportSelect } from 'skiff-front-utils';

import { AppleImportDialog } from './AppleImportDialog';

interface ImportAppleProps {
  handleMaxFileSizeExceeded: (maxSize: string) => void;
  handleFileImportError: (error: ApolloError) => void;
  uploadFilesOpen: boolean;
  setUploadFilesOpen: (open: boolean) => void;
}

export const ImportApple: React.FC<ImportAppleProps> = ({
  handleMaxFileSizeExceeded,
  handleFileImportError,
  uploadFilesOpen,
  setUploadFilesOpen
}: ImportAppleProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <ImportSelect
        icon={Icon.Apple}
        iconColor='secondary'
        label='Apple'
        onClick={() => setDialogOpen(true)}
        subLabel='Select one or more mailboxes.'
      />
      <AppleImportDialog
        handleFileImportError={handleFileImportError}
        handleMaxFileSizeExceeded={handleMaxFileSizeExceeded}
        onClose={() => {
          setDialogOpen(false);
        }}
        open={dialogOpen}
        setUploadFilesOpen={setUploadFilesOpen}
        uploadFilesOpen={uploadFilesOpen}
      />
    </>
  );
};
