import { ApolloCache, ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useRouter } from 'next/router';
import { ButtonGroup, ButtonGroupItem, Icon, Typography } from '@skiff-org/skiff-ui';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  GetGmailAutoImportStatusDocument,
  GetGoogleAuthUrlDocument,
  GetGoogleAuthUrlQuery,
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
import { ConfirmModal, ImportSelect, isMobileApp, TitleActionSection, useToast } from 'skiff-front-utils';
import { CreditTransactionReason, ImportClients } from 'skiff-graphql';
import { gbToBytes } from 'skiff-utils';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import {
  GENERAL_MAIL_IMPORT_PARAMS,
  GOOGLE_MAIL_IMPORT_PARAMS,
  OUTLOOK_MAIL_IMPORT_PARAMS
} from '../../../../constants/settings.constants';
import { useAppSelector } from '../../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { Modals, ModalType } from '../../../../redux/reducers/modalTypes';
import { getGoogleOAuth2CodeInURL, getOutlookCodeInURL } from '../../../../utils/importEmails';
import { extractHashParamFromURL } from '../../../../utils/navigation';
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
  gap: 20px;
  ${isMobile && 'flex-direction: column;'}
`;

const getParamsToDelete = (provider: ImportClients) => {
  const paramsToDelete: string[] = [];
  switch (provider) {
    case ImportClients.Gmail:
      paramsToDelete.push(...GOOGLE_MAIL_IMPORT_PARAMS);
      break;
    case ImportClients.Outlook:
      paramsToDelete.push(...OUTLOOK_MAIL_IMPORT_PARAMS);
      break;
  }
  paramsToDelete.push(...GENERAL_MAIL_IMPORT_PARAMS);
  return paramsToDelete;
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
      <Typography wrap>Import mail from {clientName}?</Typography>
      <Typography wrap>We will notify you when the import finished.</Typography>
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

export const ImportMail: React.FC<ImportMailProps> = ({ setGoogleLogin, googleLogin }: ImportMailProps) => {
  const router = useRouter();
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
  const featureFlags = useFlags();
  const gmailImportFlag = featureFlags.gmailImport as boolean;

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
      const newQuery = { ...router.query };
      const provider = googleAuthClientCode ? ImportClients.Gmail : ImportClients.Outlook;
      const paramsToDelete = getParamsToDelete(provider);
      paramsToDelete.forEach((param) => delete newQuery[param]);
      const hash = extractHashParamFromURL(router.asPath);
      void router.replace({ query: newQuery, hash, pathname: router.pathname }, undefined, { shallow: true });
    }

    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch, googleAuthClientCode, outlookAuthClientCode, router]);

  const handleGmailAuth = useCallback(async () => {
    const loginUrl = await client.query<GetGoogleAuthUrlQuery>({
      query: GetGoogleAuthUrlDocument
    });
    if (!loginUrl.data.getGoogleAuthURL) return;

    window.location.replace(loginUrl.data.getGoogleAuthURL);

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
            await client.mutate<ImportMboxEmailsMutation, ImportMboxEmailsMutationVariables>({
              mutation: ImportMboxEmailsDocument,
              variables: { importMboxRequest: { mboxFile: file, fileSizeInBytes: file.size } },
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
      <TitleActionSection subtitle='Securely import email from Gmail or other webmail accounts' />
      <ImportClientsList>
        {gmailImportFlag && (
          <ImportSelect
            dataTest='gmail-mail-import'
            destructive={isGmailConnected}
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
              isGmailConnected
                ? 'Your account is connected to Skiff.'
                : 'Earn $10 of credit when you import from Gmail.'
            }
            wrap
          />
        )}
        <ImportSelect
          dataTest='outlook-mail-import'
          icon={Icon.Envelope}
          iconColor='secondary'
          label='Outlook'
          onClick={() => {
            void handleOutlookAuth();
          }}
          sublabel='Earn $10 of credit when you import from Outlook.'
          wrap
        />
        <ImportSelect
          icon={Icon.Parcel}
          iconColor='secondary'
          label='ProtonMail'
          onClick={() => setProtonImport(true)}
          sublabel='Start with the Import/Export app.'
        />
        <ImportSelect
          icon={Icon.Mailbox}
          iconColor='secondary'
          label='MBOX file'
          onClick={() => mboxInputRef.current?.click()}
          sublabel='Upload a .mbox file to get started.'
        />
        <ImportSelect
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
