import { ApolloCache } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useRouter } from 'next/router';
import { Button, ButtonGroup, ButtonGroupItem, Dialog, DialogTypes, Icon, Icons, Typography } from 'nightwatch-ui';
import { ChangeEvent, useCallback, useRef } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { GoogleLoginButton, ImportSelect, useToast } from 'skiff-front-utils';
import { isMobileApp, TitleActionSection } from 'skiff-front-utils';
import { CreditTransactionReason, ImportClients } from 'skiff-graphql';
import {
  GetGoogleAuthUrlQuery,
  GetGoogleAuthUrlDocument,
  ImportGmailEmailsMutation,
  ImportGmailEmailsMutationVariables,
  ImportGmailEmailsDocument,
  ImportEmlEmailMutation,
  ImportEmlEmailMutationVariables,
  ImportEmlEmailDocument,
  ImportMboxEmailsMutation,
  ImportMboxEmailsMutationVariables,
  ImportMboxEmailsDocument,
  GetOutlookAuthUrlDocument,
  GetOutlookAuthUrlQuery,
  ImportOutlookEmailsDocument,
  ImportOutlookEmailsMutation,
  ImportOutlookEmailsMutationVariables,
  GetGmailAutoImportStatusDocument,
  useGetGmailAutoImportStatusQuery,
  useUnsubscribeFromGmailImportMutation,
  useGrantCreditsMutation
} from 'skiff-mail-graphql';
import styled from 'styled-components';

import client from '../../../../apollo/client';
import {
  GENERAL_MAIL_IMPORT_PARAMS,
  OUTLOOK_MAIL_IMPORT_PARAMS,
  GOOGLE_MAIL_IMPORT_PARAMS
} from '../../../../constants/settings.constants';
import { useAppSelector } from '../../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { isImportModal, Modals, ModalType } from '../../../../redux/reducers/modalTypes';
import { getOutlookCodeInURL, getGoogleOAuth2CodeInURL } from '../../../../utils/importEmails';
import { extractHashParamFromURL } from '../../../../utils/navigation';
import { MESSAGE_MAX_SIZE_IN_BYTES, MESSAGE_MAX_SIZE_IN_MB } from '../../../MailEditor/Plugins/MessageSizePlugin';

const MBOX_FILE_MAX_SIZE_IN_GB = 1;
const MBOX_FILE_MAX_SIZE_IN_BYTES = MBOX_FILE_MAX_SIZE_IN_GB * 1024 * 1024 * 1024; // 1 GB

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
      <Typography type='paragraph' wrap>
        Import mail from {clientName}?
      </Typography>
      <Typography type='paragraph' wrap>
        We will notify you when the import finished.
      </Typography>
      <ButtonGroup>
        <ButtonGroupItem key='import' label='Import mail' onClick={handleImport} />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </>
  );
};

type AutoImportConsentProps = {
  onClose: () => void;
  handleGmailImport: () => void;
};

const AutoImportConsent = ({ onClose, handleGmailImport }: AutoImportConsentProps) => {
  return (
    <>
      <Typography color='secondary' wrap>
        Skiff will import your Gmail inbox every five minutes. You can cancel the sync any time you want.
      </Typography>
      <ButtonGroup>
        <ButtonGroupItem key='import' label='Start' onClick={handleGmailImport} />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </>
  );
};

type GmailLoginProps = {
  setGoogleLogin: (value: boolean) => void;
  handleGmailAuth: () => void;
};

const GoogleLogin = ({ setGoogleLogin, handleGmailAuth }: GmailLoginProps) => {
  const { data } = useGetGmailAutoImportStatusQuery();
  const [unsubscribe] = useUnsubscribeFromGmailImportMutation();
  const { enqueueToast, closeToast } = useToast();

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
      body: `Successfully unsubscribed`,
      actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
    });
  };

  if (data?.getGmailAutoImportStatus.subscribed) {
    return (
      <>
        <Typography color='secondary' wrap>
          You are already subscribed to auto import, your mail synced every five minutes
        </Typography>
        <ButtonGroup>
          <ButtonGroupItem destructive key='cancel' label='Cancel Auto Import' onClick={handleUnsubscribe} />
          <ButtonGroupItem
            key='return'
            label='Back to import options'
            onClick={() => setTimeout(() => setGoogleLogin(false), 0)}
          />
        </ButtonGroup>
      </>
    );
  }

  return (
    <>
      <Typography color='secondary' wrap>
        Securely import email and contacts from Gmail.
      </Typography>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Icons color='source' icon={Icon.Gmail} size='xlarge' />
        <Icons color='tertiary' icon={Icon.ArrowLeft} size='xlarge' />
        <Icons icon={Icon.Skiff} size='xlarge' />
      </div>
      <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
        <Button onClick={() => void setTimeout(() => setGoogleLogin(false), 0)} type='navigation'>
          Back to import options
        </Button>
        <GoogleLoginButton onClick={handleGmailAuth} style={{ cursor: 'pointer', height: 42 }} />
      </div>
    </>
  );
};

type ImportMailProps = {
  setGoogleLogin: (login: boolean) => void;
  googleLogin: boolean;
};

export const ImportMail = (props: ImportMailProps) => {
  const { setGoogleLogin, googleLogin } = props;
  const router = useRouter();
  const dispatch = useDispatch();
  const { openModal: openSharedModal } = useAppSelector((state) => state.modal);
  const { enqueueToast, closeToast } = useToast();
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

  const onClose = useCallback(() => {
    // clean code query params
    if (googleAuthClientCode || outlookAuthClientCode) {
      const newQuery = { ...router.query };
      const provider = googleAuthClientCode ? ImportClients.Gmail : ImportClients.Outlook;
      const paramsToDelete = getParamsToDelete(provider);
      paramsToDelete.forEach((param) => delete newQuery[param]);
      const hash = extractHashParamFromURL(router.asPath);
      router.replace({ query: newQuery, hash, pathname: router.pathname }, undefined, { shallow: true });
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
    } catch (err: any) {
      err.graphQLErrors?.some((graphError: GraphQLError) => {
        if (graphError.extensions?.code === 'IMPORT_ERROR') {
          dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.ImportMail, error: graphError.message }));
          return true;
        }
        return false;
      });
    }
  }, [dispatch, googleAuthClientCode, onClose, showSettingsDrawer]);

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
            creditAmount: { cents: 0, skemailStorageBytes: '0', editorStorageBytes: '0' } // handled by backend.
          }
        },
        refetchQueries: ['getCredits']
      });
    } catch (err: any) {
      err.graphQLErrors?.some((graphError: GraphQLError) => {
        if (graphError.extensions?.code === 'IMPORT_ERROR') {
          dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.ImportMail, error: graphError.message }));
          return true;
        }
        return false;
      });
    }
  }, [dispatch, onClose, outlookAuthClientCode, showSettingsDrawer]);

  const enqueueWarning = useCallback(
    (body: string) => {
      enqueueToast({
        body,
        icon: Icon.Warning,
        actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
      });
    },
    [closeToast, enqueueToast]
  );

  const enqueueMaxSizeExceeded = useCallback(
    (maxSize: string) => {
      enqueueWarning(`File is too big. The maximum size is ${maxSize}`);
    },
    [enqueueWarning]
  );

  const handleFileImport = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      if (event.target.files?.item(0)) {
        const file = event.target.files[0];
        try {
          if (file.name.endsWith('.eml')) {
            const oversizedFiles = Array.from(event.target.files).some(
              (emlFile) => emlFile.size > MESSAGE_MAX_SIZE_IN_BYTES
            );
            if (oversizedFiles) {
              enqueueToast({
                body: `Some of the files are to big. The maximum size is ${MESSAGE_MAX_SIZE_IN_MB}mb`,
                icon: Icon.Warning,
                actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
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
          } else if (file.name.endsWith('.mbox')) {
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
              body: 'Pick .eml or .mbox file',
              icon: Icon.Warning,
              actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
            });
            return;
          }
          enqueueToast({
            body: 'Emails import started.',
            icon: Icon.Plus,
            actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
          });
        } catch (err: any) {
          err.graphQLErrors?.some((graphError: GraphQLError) => {
            if (graphError.extensions?.code === 'IMPORT_ERROR') {
              enqueueToast({
                body: err.message,
                icon: Icon.Warning,
                actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
              });
              return true;
            }
            if (graphError.extensions?.code === 'RATE_LIMIT_EXCEEDED') {
              enqueueToast({
                body: 'Something went wrong, please try again later',
                icon: Icon.Warning,
                actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
              });
              return true;
            }
            return false;
          });
          enqueueToast({
            body: 'Email import failed.',
            icon: Icon.Warning,
            actions: [{ label: 'Dismiss', onClick: (key) => closeToast(key) }]
          });
        }
        onClose();
      }
    },
    [closeToast, enqueueToast, enqueueMaxSizeExceeded, onClose]
  );

  if (isImportModal(openSharedModal) && openSharedModal.error) {
    return (
      <Dialog
        customContent
        onClose={onClose}
        open={openSharedModal?.type === ModalType.ImportMail}
        title='Import mail'
        type={DialogTypes.Input}
      >
        <>
          <Typography type='paragraph' wrap>
            {openSharedModal.error}
          </Typography>
          <ButtonGroup>
            <ButtonGroupItem key='auth' label='Try again' onClick={() => void handleOutlookAuth()} />
            <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
          </ButtonGroup>
        </>
      </Dialog>
    );
  }

  let content = (
    <>
      <TitleActionSection subtitle='Securely import email from Gmail or other webmail accounts.' />
      <ImportClientsList>
        {gmailImportFlag && (
          <ImportSelect
            dataTest='gmail-mail-import'
            icon={Icon.Gmail}
            iconColor='source'
            label='Gmail'
            onClick={() => setTimeout(() => setGoogleLogin(true), 0)}
            sublabel='Earn $15 of credit when you import from Gmail.'
            wrap
          />
        )}
        <ImportSelect
          dataTest='outlook-mail-import'
          icon={Icon.Outlook}
          iconColor='source'
          label='Outlook'
          onClick={handleOutlookAuth}
          sublabel='Earn $15 of credit when you import from Outlook.'
          wrap
        />
        <ImportSelect
          icon={Icon.Mailbox}
          iconColor='secondary'
          label='Mbox file'
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
      <input
        accept='.eml'
        multiple={true}
        onChange={handleFileImport}
        ref={emlInputRef}
        style={{ display: 'none' }}
        type='file'
      />
      <input
        accept='.mbox'
        multiple={false}
        onChange={handleFileImport}
        ref={mboxInputRef}
        style={{ display: 'none' }}
        type='file'
      />
    </>
  );

  if (outlookAuthClientCode) {
    content = (
      <ConfirmImportModal
        clientName={'Outlook'}
        handleImport={handleOutlookImport}
        onClose={onClose}
        openSharedModal={openSharedModal}
      />
    );
  }

  if (isImportModal(openSharedModal) && openSharedModal.error) {
    content = (
      <>
        <Typography wrap>{openSharedModal.error}</Typography>
        <ButtonGroup>
          <ButtonGroupItem key='auth' label='Try again' onClick={handleGmailAuth} />
          <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
        </ButtonGroup>
      </>
    );
  }

  if (googleAuthClientCode) {
    content = <AutoImportConsent handleGmailImport={handleGmailImport} onClose={onClose} />;
  }

  if (googleLogin) {
    content = <GoogleLogin handleGmailAuth={handleGmailAuth} setGoogleLogin={setGoogleLogin} />;
  }

  return content;
};
