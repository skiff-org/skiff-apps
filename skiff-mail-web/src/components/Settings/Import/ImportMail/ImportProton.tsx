import { Icon } from 'nightwatch-ui';
import { useState } from 'react';
import { ImportSelect } from 'skiff-front-utils';

import { ProtonImportDialog } from './ProtonImportDialog';

interface ImportProtonProps {
  setUploadMboxFilesOpen: (open: boolean) => void;
  setUploadEmlFilesOpen: (open: boolean) => void;
}

export const ImportProton: React.FC<ImportProtonProps> = ({
  setUploadMboxFilesOpen,
  setUploadEmlFilesOpen
}: ImportProtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <ImportSelect
        icon={Icon.Proton}
        iconColor='source'
        label='ProtonMail'
        onClick={() => setDialogOpen(true)}
        subLabel='Start with the Import/Export app.'
      />
      <ProtonImportDialog
        onClose={() => {
          setDialogOpen(false);
        }}
        open={dialogOpen}
        setUploadEmlFilesOpen={setUploadEmlFilesOpen}
        setUploadMboxFilesOpen={setUploadMboxFilesOpen}
      />
    </>
  );
};
