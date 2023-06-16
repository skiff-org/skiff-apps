import { useFlags } from 'launchdarkly-react-client-sdk';
import debounce from 'lodash/debounce';
import React, { useRef } from 'react';
import { useCreateOrUpdateContactMutation } from 'skiff-front-graphql';

import { useToast } from '../../../hooks';
import useGetAllContactsWithOrgMembers from '../../../hooks/useGetAllContactsWithOrgMembers';
import TitleActionSection from '../TitleActionSection';

const ContactsImport = () => {
  const flags = useFlags();
  const importBtnRef = useRef<HTMLInputElement>(null);
  const [createOrUpdateContact] = useCreateOrUpdateContactMutation();

  // Graphql
  const { refetch } = useGetAllContactsWithOrgMembers({
    onError: (err) => {
      console.error('Failed to load contacts', err);
    }
  });
  const { enqueueToast } = useToast();

  const showContactImportFlag = (flags.showContactImport as boolean) || window.location.hostname === 'localhost';

  const debouncedRefresh = debounce(
    () => {
      void refetch();
      console.log('Refetching contacts');
    },
    2000,
    {
      maxWait: 5000 // refetch every 5s max
    }
  );
  const importContactFile = async (file: File) => {
    const reader = new FileReader();
    reader.readAsText(file);
    const vCard = await import('vcf');
    reader.onload = (e) => {
      const text = e.target?.result;
      if (text && typeof text === 'string') {
        const cards = vCard.default.parse(text);
        for (const card of cards) {
          try {
            const name = card.get('fn');
            const emailProp = card.get('email');
            if (name && emailProp) {
              const emailPropToRead = emailProp instanceof Array ? emailProp[0] : emailProp;
              const nameToRead = name instanceof Array ? name[0] : name;
              const nameValue = nameToRead.valueOf();
              const emailValue = emailPropToRead.valueOf();
              const [firstName, lastName] = nameValue.toString().split(' ');
              console.log('importing contact', nameValue, emailValue, firstName, lastName);
              void createOrUpdateContact({
                variables: {
                  request: {
                    emailAddress: emailValue,
                    firstName: firstName ?? '',
                    lastName: lastName ?? '',
                    displayPictureData: undefined
                  }
                },
                onCompleted: debouncedRefresh
              });
            }
          } catch (error) {
            console.log('Could not read contact', error);
          }
        }
      }
    };
  };

  const handleContactImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length && importContactFile) {
      for (const file of files) {
        void importContactFile(file);
      }
    }
    enqueueToast({ title: 'Contacts importing' });
  };

  return (
    <>
      {showContactImportFlag && (
        <input
          accept='.vcf'
          multiple={true}
          onChange={(e) => void handleContactImport(e)}
          ref={importBtnRef}
          style={{ display: 'none' }}
          type='file'
        />
      )}
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
    </>
  );
};

export default ContactsImport;
