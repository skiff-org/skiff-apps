import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  useCreateImportSessionMutation,
  useEnableGmailImportMutation,
  useGetCreditsQuery,
  useGetGmailLabelsLazyQuery,
  useGrantCreditsMutation
} from 'skiff-front-graphql';
import {
  getCreditCentsForInfoType,
  ImportSelect,
  isDesktopApp,
  isMobileApp,
  useRequiredCurrentUserData,
  useToast
} from 'skiff-front-utils';
import {
  AuthAction,
  CreditInfo,
  CreditTransactionReason,
  EmailImportDateRange,
  EntityType,
  ImportClients,
  SystemLabels
} from 'skiff-graphql';
import { assertExists } from 'skiff-utils';

import client from '../../../../apollo/client';
import { skemailImportReducer } from '../../../../redux/reducers/importReducer';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { clearAuthCodes, getGoogleOAuth2CodeInURL, signIntoGoogle } from '../../../../utils/importEmails';
import { useNavigate } from '../../../../utils/navigation';
import { SignIntoGoogle } from '../../../shared/SignIntoExternalProvider';
import { useSettings } from '../../useSettings';

import { DesktopWarningModal } from './DesktopWarningModal';
import { ImportMailStepsModal } from './ImportMailStepsModal';
import { ExternalLabelsAndFoldersResult } from './ImportMailStepsModal/ImportMailStepsModal.types';

export const ImportGmail: React.FC = () => {
  const { userID } = useRequiredCurrentUserData();

  const dispatch = useDispatch();
  const { enqueueToast } = useToast();
  const [getGmailLabels] = useGetGmailLabelsLazyQuery({ fetchPolicy: 'no-cache' });
  const [startGmailImport] = useEnableGmailImportMutation();
  const [createImportSession] = useCreateImportSessionMutation();
  const [importID, setImportID] = useState<string | null>(null);

  const [importMailStepsOpen, setImportMailStepsOpen] = useState(false);
  const [googleLoginOpen, setGoogleLoginOpen] = useState(false);
  const [desktopWarningOpen, setDesktopWarningOpen] = useState(false);

  const [selectedLabelIDs, setSelectedLabelIDs] = useState<string[]>();
  const [selectedDateRange, setSelectedDateRange] = useState<EmailImportDateRange>();

  const { closeSettings } = useSettings();
  const { navigateToSystemLabel } = useNavigate();

  const showSettingsDrawer = useCallback(
    () =>
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.Settings
        })
      ),
    [dispatch]
  );

  // Fetch user's credit info to determine if the user has already received
  // credits from gmail import
  const { data: creditsData, loading: creditsDataLoading } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [CreditInfo.CreditsFromGmailImport]
      }
    }
  });
  const { credits: creditsResponse } = creditsData || {};
  const creditInfo = creditsResponse?.credits || [];
  const didEarnCreditsFromGmailImport = !!getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromGmailImport);

  // check if there is google auth code in the query params
  const { authCode: googleAuthClientCode, state: googleStateCode } = getGoogleOAuth2CodeInURL();

  const [grantCredits] = useGrantCreditsMutation();

  const clearGmailAuthCode = useCallback(() => {
    // clean code query params
    if (googleAuthClientCode) {
      const provider = googleAuthClientCode ? ImportClients.Gmail : ImportClients.Outlook;
      clearAuthCodes(provider);
    }
  }, [googleAuthClientCode]);

  const handleGoogleAuth = useCallback(async () => {
    await signIntoGoogle(client, AuthAction.Import);

    // Since mobile app does not open google auth url in app (open is browser)
    // we need to reset googleLogin state
    if (isMobileApp()) setTimeout(() => setGoogleLoginOpen(false), 0);
  }, [setGoogleLoginOpen]);

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
    if (isMobile) {
      // On mobile open settings drawer
      showSettingsDrawer();
    }

    try {
      if (!selectedDateRange) {
        // If we reach here, this is an error with our code
        console.error('Cannot start import. Missing a selected date range to import from.');
        return;
      }
      if (!importID) {
        console.error('Cannot start import. Missing import ID.');
        return;
      }
      navigateToSystemLabel(SystemLabels.Imports);
      dispatch(skemailImportReducer.actions.startImport());
      closeSettings();

      await startGmailImport({
        variables: {
          request: {
            importID,
            dateRange: selectedDateRange,
            includeGmailLabelIDs: selectedLabelIDs?.length ? selectedLabelIDs : undefined,
            subscribeToAutoImport: true
          }
        }
      });

      // Grant one-time credit if the user has not yet received credits from importing
      if (!didEarnCreditsFromGmailImport) {
        void grantCredits({
          variables: {
            request: {
              creditTransactionReason: CreditTransactionReason.GmailImport,
              creditAmount: { cents: 0, skemailStorageBytes: '0', editorStorageBytes: '0' } // one-time credit reward handled by backend
            }
          },
          refetchQueries: ['getCredits']
        });
      }
    } catch (err) {
      if (err instanceof ApolloError) {
        err.graphQLErrors?.some((graphError: GraphQLError) => {
          if (graphError.extensions?.code === 'IMPORT_ERROR') {
            handleImportError(graphError.message, handleGoogleAuth);
            return true;
          }
          return false;
        });
      }
      dispatch(skemailImportReducer.actions.stopImport());
    }
  }, [
    closeSettings,
    didEarnCreditsFromGmailImport,
    dispatch,
    grantCredits,
    handleGoogleAuth,
    handleImportError,
    importID,
    navigateToSystemLabel,
    selectedDateRange,
    selectedLabelIDs,
    showSettingsDrawer,
    startGmailImport
  ]);

  useEffect(() => {
    if (!googleAuthClientCode) return;
    setImportMailStepsOpen(true);
  }, [googleAuthClientCode, handleGmailImport]);

  useEffect(() => {
    if (googleAuthClientCode && googleStateCode) {
      createImportSession({
        variables: {
          request: {
            code: googleAuthClientCode,
            client: ImportClients.Gmail,
            state: googleStateCode
          }
        }
      })
        .then((res) => {
          assertExists(res.data?.createImportSession.importID, 'Failed to create import session.');
          setImportID(res.data?.createImportSession?.importID);
        })
        .catch((err) => {
          console.error('Failed to create import session', err);
          enqueueToast({
            title: 'Gmail import failed',
            body: 'Could not start import. Please try again later.'
          });
        });
      clearGmailAuthCode();
    }
  }, [clearGmailAuthCode, createImportSession, enqueueToast, googleAuthClientCode]);

  const fetchGmailLabels = useCallback(async () => {
    if (importID) {
      return getGmailLabels({
        variables: {
          request: {
            importID
          }
        }
      })
        .then((result): ExternalLabelsAndFoldersResult => {
          return {
            externalLabels: result.data?.gmailInboxOrganization.labels
          };
        })
        .catch((err) => {
          console.error('Failed to fetch gmail labels', err);
          enqueueToast({
            title: 'Failed to fetch Gmail labels',
            body: 'Could not get Gmail labels to import. Please try again later.'
          });
          return {
            externalLabels: undefined
          };
        });
    }
  }, [importID, getGmailLabels, enqueueToast]);

  const getSubLabel = () => {
    if (isDesktopApp()) return 'Access Skiff Mail through a web browser to import Gmail messages.';

    return didEarnCreditsFromGmailImport || creditsDataLoading
      ? 'Import Gmail messages into Skiff.'
      : 'Earn $10 of credit when you import from Gmail.';
  };

  const importActionLabel = 'Import your Gmail messages to Skiff';

  return (
    <>
      <ImportSelect
        dataTest='gmail-mail-import'
        icon={Icon.Gmail}
        iconColor='source'
        label='Gmail'
        onClick={() => {
          if (isDesktopApp()) {
            setDesktopWarningOpen(true);
            return;
          }

          setTimeout(() => setGoogleLoginOpen(true), 0);
        }}
        subLabel={getSubLabel()}
        wrap
      />
      <SignIntoGoogle
        actionLabel={importActionLabel}
        handleGoogleAuth={handleGoogleAuth}
        onClose={() => void setTimeout(() => setGoogleLoginOpen(false), 0)}
        open={googleLoginOpen}
      />
      <ImportMailStepsModal
        fetchExternalLabelsAndFolders={fetchGmailLabels}
        importClient={ImportClients.Gmail}
        importID={importID ?? undefined}
        onClose={() => {
          setImportMailStepsOpen(false);
        }}
        onStartImport={handleGmailImport}
        open={!!importMailStepsOpen}
        selectedDateRange={selectedDateRange}
        selectedLabelIDs={selectedLabelIDs}
        setSelectedDateRange={setSelectedDateRange}
        setSelectedLabelIDs={setSelectedLabelIDs}
      />
      <DesktopWarningModal
        actionLabel={importActionLabel}
        onClose={() => {
          setDesktopWarningOpen(false);
        }}
        open={desktopWarningOpen}
        providerIcon={Icon.Gmail}
        providerLabel='Gmail'
      />
    </>
  );
};
