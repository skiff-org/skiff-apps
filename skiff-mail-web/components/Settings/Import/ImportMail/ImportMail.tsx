import { ApolloCache, ApolloError } from '@apollo/client';
import { ButtonGroup, ButtonGroupItem, Divider, Icon, Typography } from '@skiff-org/skiff-ui';
import axios from 'axios';
import { GraphQLError } from 'graphql';
import * as t from 'io-ts';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  GetGmailAutoImportStatusDocument,
  GetMboxImportUrlDocument,
  GetMboxImportUrlMutation,
  GetMboxImportUrlMutationVariables,
  GetOutlookAuthUrlDocument,
  GetOutlookAuthUrlQuery,
  ImportEmlEmailDocument,
  ImportEmlEmailMutation,
  ImportEmlEmailMutationVariables,
  ImportGmailEmailsDocument,
  ImportGmailEmailsMutation,
  ImportGmailEmailsMutationVariables,
  ImportMboxEmailsDocument,
  ImportMboxEmailsMutation,
  ImportMboxEmailsMutationVariables,
  ImportOutlookEmailsDocument,
  ImportOutlookEmailsMutation,
  ImportOutlookEmailsMutationVariables,
  useGetGmailAutoImportStatusQuery,
  useGrantCreditsMutation,
  useUnsubscribeFromGmailImportMutation
} from 'skiff-front-graphql';
import {
  ConfirmModal,
  getEnvironment,
  ImportSelect,
  isMobileApp,
  TitleActionSection,
  useToast
} from 'skiff-front-utils';
import { CreditTransactionReason, ImportClients } from 'skiff-graphql';
import { assertExists, AutoForwardingFlag, gbToBytes } from 'skiff-utils';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import { useAppSelector } from '../../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { Modals, ModalType } from '../../../../redux/reducers/modalTypes';
import {
  clearAuthCodes,
  getGoogleOAuth2CodeInURL,
  getOutlookCodeInURL,
  signIntoGoogle
} from '../../../../utils/importEmails';
import { MESSAGE_MAX_SIZE_IN_BYTES, MESSAGE_MAX_SIZE_IN_MB } from '../../../MailEditor/Plugins/MessageSizePlugin';

import { GmailImportDialog } from './GmailImportDialog';
import { ProtonImportDialog } from './ProtonImportDialog';

const MBOX_FILE_MAX_SIZE_IN_GB = 1;
const MBOX_FILE_MAX_SIZE_IN_BYTES = gbToBytes(MBOX_FILE_MAX_SIZE_IN_GB); // 1 GB

const ImportClientsList = styled.div`
  width: 100%;
  align-items: center;
  justify-content: center;
  display: flex;
  flex-direction: column;
  gap: 12px;
  ${isMobile && 'flex-direction: column;'}
`;

const ImportListDivider: React.FC = () => {
  return <Divider color='tertiary' />;
};

type ConfirmImportModalProps = {
  onClose: () => void;
  openSharedModal: Modals | undefined;
  handleImport: () => void;
  clientName: string;
};

const ConfirmImportModal = ({ onClose, handleImport, clientName }: ConfirmImportModalProps) => {
  return (
    <>
      <Typography mono uppercase wrap>
        Import mail from {clientName}?
      </Typography>
      <Typography mono uppercase wrap>
        We will notify you when the import finished.
      </Typography>
      <ButtonGroup>
        <ButtonGroupItem key='import' label='Import mail' onClick={handleImport} />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </>
  );
};

interface ImportMailProps {
  setGoogleLogin: (login: boolean) => void;
  googleLogin: boolean;
}

const MboxImportSigedDataValidator = t.type({
  url: t.string,
  fields: t.record(t.string, t.string)
});

export const ImportMail: React.FC<ImportMailProps> = ({ setGoogleLogin, googleLogin }: ImportMailProps) => {
  const flags = useFlags();
  const env = getEnvironment(new URL(window.location.origin));
  const hasAutoForwardingFlag = env === 'local' || env === 'vercel' || (flags.autoForwarding as AutoForwardingFlag);

  const dispatch = useDispatch();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const { enqueueToast } = useToast();
  const { data: gmailData, loading: gmailDataLoading } = useGetGmailAutoImportStatusQuery();
  const [unsubscribe] = useUnsubscribeFromGmailImportMutation();
  // Show modal before disabling gmail auto import
  const [showDisableGmail, setShowDisableGmail] = useState(false);
  const [protonImport, setProtonImport] = useState(false);
  const [isGmailConnected, setIsGmailConnected] = useState(
    gmailData?.getGmailAutoImportStatus.subscribed && !gmailDataLoading
  );

  useEffect(() => {
    // Update isGmailConnected value once the data is loaded
    if (!gmailDataLoading && gmailData) {
      setIsGmailConnected(gmailData.getGmailAutoImportStatus.subscribed);
    }
  }, [gmailData, gmailDataLoading]);

  const showSettingsDrawer = useCallback(
    () =>
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.Settings
        })
      ),
    [dispatch]
  );
  const emlInputRef = useRef<HTMLInputElement | null>(null);
  const mboxInputRef = useRef<HTMLInputElement | null>(null);

  // check if there is google auth code in the query params
  const googleAuthClientCode = getGoogleOAuth2CodeInURL();
  const outlookAuthClientCode = getOutlookCodeInURL();
  const [grantCredits] = useGrantCreditsMutation();

  const handleUnsubscribe = async () => {
    await unsubscribe({
      update: (cache: ApolloCache<any>) => {
        cache.writeQuery({
          query: GetGmailAutoImportStatusDocument,
          data: {
            getGmailAutoImportStatus: {
              subscribed: false
            }
          }
        });
      }
    });

    enqueueToast({
      title: `Successfully unsubscribed`,
      body: 'Google account no longer connected.'
    });
    setIsGmailConnected(false);
  };

  const onClose = useCallback(() => {
    // clean code query params
    if (googleAuthClientCode || outlookAuthClientCode) {
      const provider = googleAuthClientCode ? ImportClients.Gmail : ImportClients.Outlook;
      clearAuthCodes(provider);
    }

    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch, googleAuthClientCode, outlookAuthClientCode]);

  const handleGmailAuth = useCallback(async () => {
    await signIntoGoogle(client);

    // Since mobile app does not open google auth url in app (open is browser)
    // we need to reset googleLogin state
    if (isMobileApp()) setTimeout(() => setGoogleLogin(false), 0);
  }, [setGoogleLogin]);

  const handleOutlookAuth = useCallback(async () => {
    const loginUrl = await client.query<GetOutlookAuthUrlQuery>({
      query: GetOutlookAuthUrlDocument
    });
    if (!loginUrl.data.getOutlookAuthUrl) return;
    window.location.replace(loginUrl.data.getOutlookAuthUrl);
  }, []);

  const handleImportError = useCallback(
    (errorMsg: string, retryAuth: () => Promise<void>) => {
      enqueueToast({
        title: 'Import failed',
        body: errorMsg,
        actions: [
          {
            label: 'Try again',
            onClick: retryAuth
          }
        ]
      });
    },
    [enqueueToast]
  );

  const handleGmailImport = useCallback(async () => {
    if (!googleAuthClientCode) return;
    onClose();

    // On mobile open settings drawer
    if (isMobile) {
      showSettingsDrawer();
    }

    try {
      await client.mutate<ImportGmailEmailsMutation, ImportGmailEmailsMutationVariables>({
        mutation: ImportGmailEmailsDocument,
        variables: {
          request: {
            code: googleAuthClientCode,
            subscribeToAutoImport: true
          }
        }
      });
      enqueueToast({
        title: 'Google account connected',
        body: 'Emails will be automatically imported every 5 minutes.'
      });
      setIsGmailConnected(true);
      // Grant one-time credit
      void grantCredits({
        variables: {
          request: {
            creditTransactionReason: CreditTransactionReason.GmailImport,
            creditAmount: { cents: 0, skemailStorageBytes: '0', editorStorageBytes: '0' } // one-time credit reward handled by backend
          }
        },
        refetchQueries: ['getCredits']
      });
    } catch (err) {
      if (err instanceof ApolloError) {
        err.graphQLErrors?.some((graphError: GraphQLError) => {
          if (graphError.extensions?.code === 'IMPORT_ERROR') {
            handleImportError(graphError.message, handleGmailAuth);
            return true;
          }
          return false;
        });
      }
    }
  }, [
    enqueueToast,
    googleAuthClientCode,
    grantCredits,
    handleGmailAuth,
    handleImportError,
    onClose,
    showSettingsDrawer
  ]);

  // auto consent to complete sign up
  useEffect(() => {
    if (googleAuthClientCode) {
      void handleGmailImport();
    }
  }, [googleAuthClientCode, handleGmailImport]);

  const handleOutlookImport = useCallback(async () => {
    if (!outlookAuthClientCode) return;

    onClose();

    // On mobile open settings drawer
    if (isMobile) {
      showSettingsDrawer();
    }

    try {
      await client.mutate<ImportOutlookEmailsMutation, ImportOutlookEmailsMutationVariables>({
        mutation: ImportOutlookEmailsDocument,
        variables: {
          code: outlookAuthClientCode
        }
      });

      // Grant one-time credit
      void grantCredits({
        variables: {
          request: {
            creditTransactionReason: CreditTransactionReason.OutlookImport,
            creditAmount: { cents: 0, skemailStorageBytes: '0', editorStorageBytes: '0' } // one-time credit reward handled by backend
          }
        },
        refetchQueries: ['getCredits']
      });
    } catch (err) {
      if (err instanceof ApolloError) {
        err.graphQLErrors?.some((graphError: GraphQLError) => {
          if (graphError.extensions?.code === 'IMPORT_ERROR') {
            handleImportError(graphError.message, handleOutlookAuth);
            return true;
          }
          return false;
        });
      }
    }
  }, [grantCredits, handleImportError, handleOutlookAuth, onClose, outlookAuthClientCode, showSettingsDrawer]);

  const enqueueMaxSizeExceeded = useCallback(
    (maxSize: string) => {
      enqueueToast({
        title: 'Import failed',
        body: `File is too big. The maximum size is ${maxSize}`
      });
    },
    [enqueueToast]
  );

  const handleFileImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (event.target.files?.item(0)) {
        const file = event.target.files[0];
        try {
          if (file?.name.endsWith('.eml')) {
            const oversizedFiles = Array.from(event.target.files).some(
              (emlFile) => emlFile.size > MESSAGE_MAX_SIZE_IN_BYTES
            );
            if (oversizedFiles) {
              enqueueToast({
                title: 'Files too big',
                body: `The maximum size is ${MESSAGE_MAX_SIZE_IN_MB}mb.`
              });
              return;
            }

            await client.mutate<ImportEmlEmailMutation, ImportEmlEmailMutationVariables>({
              mutation: ImportEmlEmailDocument,
              variables: { importRequest: { emlFiles: Array.from(event.target.files) } },
              context: {
                headers: {
                  'Apollo-Require-Preflight': true // this is required for files uploading. Otherwise, router backend will reject request.
                }
              }
            });
          } else if (file?.name.endsWith('.mbox')) {
            if (file.size > MBOX_FILE_MAX_SIZE_IN_BYTES) {
              enqueueMaxSizeExceeded(`${MBOX_FILE_MAX_SIZE_IN_GB}gb`);
              onClose();
              return;
            }
            const { data } = await client.mutate<GetMboxImportUrlMutation, GetMboxImportUrlMutationVariables>({
              mutation: GetMboxImportUrlDocument,
              variables: {
                getImportUrlRequest: {
                  fileSizeInBytes: file.size
                }
              }
            });

            assertExists(data);
            assertExists(data.getMboxImportUrl);
            const { uploadData, fileID } = data.getMboxImportUrl;
            const uploadDataParsed = JSON.parse(uploadData) as unknown;
            if (!MboxImportSigedDataValidator.is(uploadDataParsed)) {
              throw new Error('Invalid upload data');
            }
            const formData = new FormData();

            Object.entries(uploadDataParsed.fields).forEach(([key, value]) => {
              formData.append(key, value);
            });
            formData.append('file', file);
            await axios(uploadDataParsed.url, {
              method: 'POST',
              data: formData
              // Can be used to get progress. Not used for now.
              // onUploadProgress: (progressEvent) => {
              //   // console.log(progressEvent);
              // }
            });

            await client.mutate<ImportMboxEmailsMutation, ImportMboxEmailsMutationVariables>({
              mutation: ImportMboxEmailsDocument,
              variables: { importMboxRequest: { fileID } },
              context: {
                headers: {
                  'Apollo-Require-Preflight': true // this is required for files uploading. Otherwise, router backend will reject request.
                }
              }
            });
          } else {
            enqueueToast({
              title: 'Invalid file type',
              body: 'You can import .eml or .mbox files.'
            });
            return;
          }
          enqueueToast({
            title: 'Import started',
            body: 'Emails are being added into your inbox.'
          });
        } catch (err) {
          if (err instanceof ApolloError) {
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
          }
        }
        onClose();
      }
    },
    [enqueueToast, enqueueMaxSizeExceeded, onClose]
  );

  if (outlookAuthClientCode) {
    return (
      <ConfirmImportModal
        clientName='Outlook'
        handleImport={() => {
          void handleOutlookImport();
        }}
        onClose={onClose}
        openSharedModal={openSharedModal}
      />
    );
  }

  return (
    <>
      <TitleActionSection
        subtitle='Securely import past email from Gmail or other webmail accounts'
        title={hasAutoForwardingFlag ? 'Import mail' : undefined}
      />
      <ImportClientsList>
        <ImportSelect
          dataTest='gmail-mail-import'
          destructive={isGmailConnected}
          hasAutoForwardingFlag={hasAutoForwardingFlag}
          icon={Icon.Gmail}
          iconColor='source'
          label='Gmail'
          onClick={() => {
            if (!isGmailConnected) {
              setTimeout(() => setGoogleLogin(true), 0);
            } else {
              setShowDisableGmail(true);
            }
          }}
          onClickLabel={isGmailConnected ? 'Disable' : 'Import'}
          sublabel={
            isGmailConnected ? 'Your account is connected to Skiff.' : 'Earn $10 of credit when you import from Gmail.'
          }
          wrap
        />
        <ImportListDivider />
        <ImportSelect
          dataTest='outlook-mail-import'
          hasAutoForwardingFlag={hasAutoForwardingFlag}
          icon={Icon.Outlook}
          iconColor='source'
          label='Outlook'
          onClick={() => {
            void handleOutlookAuth();
          }}
          sublabel='Earn $10 of credit when you import from Outlook.'
          wrap
        />
        <ImportListDivider />
        <ImportSelect
          hasAutoForwardingFlag={hasAutoForwardingFlag}
          icon={Icon.Proton}
          iconColor='source'
          label='ProtonMail'
          onClick={() => setProtonImport(true)}
          sublabel='Start with the Import/Export app.'
        />
        <ImportListDivider />
        <ImportSelect
          hasAutoForwardingFlag={hasAutoForwardingFlag}
          icon={Icon.Mailbox}
          iconColor='secondary'
          label='MBOX file'
          onClick={() => mboxInputRef.current?.click()}
          sublabel='Upload a .mbox file to get started.'
        />
        <ImportListDivider />
        <ImportSelect
          hasAutoForwardingFlag={hasAutoForwardingFlag}
          icon={Icon.File}
          iconColor='secondary'
          label='EML file'
          onClick={() => emlInputRef.current?.click()}
          sublabel='Upload a .eml file to get started.'
        />
      </ImportClientsList>
      <GmailImportDialog
        handleGmailAuth={handleGmailAuth}
        onClose={() => void setTimeout(() => setGoogleLogin(false), 0)}
        open={googleLogin}
      />
      <ProtonImportDialog
        emlRef={emlInputRef}
        mboxRef={mboxInputRef}
        onClose={() => {
          setProtonImport(false);
        }}
        open={protonImport}
      />
      <ConfirmModal
        confirmName='Disable'
        description='You will no longer automatically receive emails from your Gmail account.'
        destructive
        onClose={() => setShowDisableGmail(false)}
        onConfirm={async () => {
          await handleUnsubscribe();
          setShowDisableGmail(false);
        }}
        open={showDisableGmail}
        title='Disable Gmail auto-import?'
      />
      <input
        accept='.eml'
        multiple={true}
        onChange={(event) => {
          void handleFileImport(event);
        }}
        ref={emlInputRef}
        style={{ display: 'none' }}
        type='file'
      />
      <input
        accept='.mbox'
        multiple={false}
        onChange={(event) => {
          void handleFileImport(event);
        }}
        ref={mboxInputRef}
        style={{ display: 'none' }}
        type='file'
      />
    </>
  );
};
