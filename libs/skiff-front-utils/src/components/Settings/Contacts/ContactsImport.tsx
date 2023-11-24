import debounce from 'lodash/debounce';
import { FilledVariant, Icon, IconText } from 'nightwatch-ui';
import React, { useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useCreateOrUpdateContactMutation } from 'skiff-front-graphql';

import { useRequiredCurrentUserData } from '../../../apollo';
import { useToast, useWarnBeforeUnloading } from '../../../hooks';
import useGetAllContactsWithOrgMembers from '../../../hooks/useGetAllContactsWithOrgMembers';
import TitleActionSection from '../TitleActionSection';

import { handleContactImport } from './ContactsImport.utils';

const ContactsImport = () => {
  const importBtnRef = useRef<HTMLInputElement>(null);
  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();
  const [isImporting, setIsImporting] = React.useState(false);

  // Graphql
  const { refetch } = useGetAllContactsWithOrgMembers({
    onError: (err) => {
      console.error('Failed to load contacts', err);
    }
  });
  const { enqueueToast } = useToast();
  const userData = useRequiredCurrentUserData();

  const debouncedRefresh = debounce(
    () => {
      void refetch();
    },
    2000,
    {
      maxWait: 5000 // refetch every 5s max
    }
  );

  useWarnBeforeUnloading(isImporting);

  return (
    <>
      <input
        accept='.vcf, .csv'
        multiple={true}
        onChange={(e) =>
          void handleContactImport(
            e.target.files,
            setIsImporting,
            enqueueToast,
            userData,
            createOrUpdateContact,
            debouncedRefresh
          )
        }
        ref={importBtnRef}
        style={{ display: 'none' }}
        type='file'
      />
      {isMobile && (
        <TitleActionSection
          actions={[
            {
              onClick: () => importBtnRef.current?.click(),
              label: 'Import',
              type: 'button'
            }
          ]}
          subtitle='Upload your contacts from a vCard file'
          title='Import contacts'
        />
      )}
      {!isMobile && (
        <IconText
          onClick={() => importBtnRef.current?.click()}
          startIcon={Icon.Upload}
          tooltip='Import contacts'
          variant={FilledVariant.FILLED}
        />
      )}
    </>
  );
};

export default ContactsImport;
