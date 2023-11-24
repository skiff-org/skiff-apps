import { Icon } from 'nightwatch-ui';
import React, { Suspense, useEffect, useState } from 'react';
import { ImportSelect, lazyWithPreload } from 'skiff-front-utils';

const GCalImportDialog = lazyWithPreload(() => import('./GCalImportDialog'));

export const ImportGoogleCalendar = () => {
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    void Promise.all([GCalImportDialog.preload()]);
  }, []);

  return (
    <>
      <ImportSelect
        dataTest='google-calendar-mail-import'
        icon={Icon.GoogleCalendar}
        iconColor='source'
        label='Google Calendar'
        onClick={() => setOpenDialog(true)}
        subLabel='Earn $10 of credit when you import from Google Calendar'
        wrap
      />
      <Suspense fallback={null}>
        <GCalImportDialog onClose={() => setOpenDialog(false)} open={openDialog} />
      </Suspense>
    </>
  );
};
