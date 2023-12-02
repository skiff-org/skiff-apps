import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { useState } from 'react';
import { TitleActionSection, useToast } from 'skiff-front-utils';
import styled from 'styled-components';

import { ImportApple } from './ImportApple';
import { ImportEml } from './ImportEml';
import { ImportGmail } from './ImportGmail';
import { ImportMbox } from './ImportMbox';
import { ImportOutlook } from './ImportOutlook';
import { ImportProton } from './ImportProton';

const ImportClientsList = styled.div`
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const ImportMail: React.FC = () => {
  const { enqueueToast } = useToast();

  const [uploadMboxFilesOpen, setUploadMboxFilesOpen] = useState(false);
  const [uploadEmlFilesOpen, setUploadEmlFilesOpen] = useState(false);

  const handleMaxFileSizeExceeded = (maxSize: string) => {
    enqueueToast({
      title: 'Import failed',
      body: `File is too big. The maximum size is ${maxSize}.`
    });
  };

  const handleFileImportError = (err: ApolloError) => {
    err.graphQLErrors?.some((graphError: GraphQLError) => {
      if (graphError.extensions?.code === 'IMPORT_ERROR') {
        enqueueToast({
          title: 'Import failed',
          body: (err as Error).message
        });
        return true;
      }
      if (graphError.extensions?.code === 'RATE_LIMIT_EXCEEDED') {
        enqueueToast({
          title: 'Import failed',
          body: 'Could not add emails to inbox.'
        });
        return true;
      }
      return false;
    });
    enqueueToast({
      title: 'Import failed',
      body: 'Could not add emails to inbox.'
    });
  };

  return (
    <>
      <TitleActionSection subtitle='Securely import past email from Gmail or other webmail accounts' />
      <ImportClientsList>
        <ImportGmail />
        <ImportOutlook />
        <ImportProton setUploadEmlFilesOpen={setUploadEmlFilesOpen} setUploadMboxFilesOpen={setUploadMboxFilesOpen} />
        <ImportApple
          handleFileImportError={handleFileImportError}
          handleMaxFileSizeExceeded={handleMaxFileSizeExceeded}
          setUploadFilesOpen={setUploadMboxFilesOpen}
          uploadFilesOpen={uploadMboxFilesOpen}
        />
        <ImportMbox
          handleFileImportError={handleFileImportError}
          handleMaxFileSizeExceeded={handleMaxFileSizeExceeded}
          setUploadFilesOpen={setUploadMboxFilesOpen}
          uploadFilesOpen={uploadMboxFilesOpen}
        />
        <ImportEml
          handleFileImportError={handleFileImportError}
          handleMaxFileSizeExceeded={handleMaxFileSizeExceeded}
          setUploadFilesOpen={setUploadEmlFilesOpen}
          uploadFilesOpen={uploadEmlFilesOpen}
        />
      </ImportClientsList>
    </>
  );
};
