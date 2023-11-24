import { Dialog } from 'nightwatch-ui';
import React from 'react';
import { isMobile } from 'react-device-detect';
import { Illustration, Illustrations } from 'skiff-front-utils';

import { GCalImportDialogContent } from './GCalImportDialogContent';

type GCalImportDialogProps = {
  open: boolean;
  onClose: () => void | Promise<void>;
};

export const GCalImportDialog = (props: GCalImportDialogProps) => {
  const { open, onClose } = props;

  return (
    <>
      <Dialog
        customContent
        description='Securely import events from Google Calendar.'
        key='cal-import-modal'
        onClose={() => void onClose()}
        open={open}
        title='Connect Google Calendar'
      >
        <Illustration illustration={Illustrations.MigrateCal} style={{ marginLeft: isMobile ? '-70px' : undefined }} />
        <GCalImportDialogContent onClose={onClose} />
      </Dialog>
    </>
  );
};

export default GCalImportDialog;
