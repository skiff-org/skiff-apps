import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { Icon } from 'nightwatch-ui';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import {
  ExternalEmailClientLabelFragment,
  useCreateImportSessionMutation,
  useEnableOutlookImportMutation,
  useGetCreditsQuery,
  useGetOutlookCategoriesAndFoldersLazyQuery,
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

import { skemailImportReducer } from '../../../../redux/reducers/importReducer';
import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import { clearAuthCodes, getOutlookCodeInURL, signIntoOutlook } from '../../../../utils/importEmails';
import { useNavigate } from '../../../../utils/navigation';
import { SignIntoOutlook } from '../../../shared/SignIntoExternalProvider';
import { useSettings } from '../../useSettings';

import { DesktopWarningModal } from './DesktopWarningModal';
import { ImportMailStepsModal } from './ImportMailStepsModal';
import { ExternalLabelsAndFoldersResult } from './ImportMailStepsModal/ImportMailStepsModal.types';

// Default categories Outlook creates for every account
const DEFAULT_OUTLOOK_CATEGORIES = [
  'Blue category',
  'Green category',
  'Orange category',
  'Purple category',
  'Red category',
  'Yellow category'
];

export const ImportOutlook: React.FC = () => {
  const { userID } = useRequiredCurrentUserData();

  const dispatch = useDispatch();
  const { enqueueToast } = useToast();

  const [importMailStepsOpen, setImportMailStepsOpen] = useState(false);
  const [outlookSignInModalOpen, setOutlookSignInModalOpen] = useState(false);
  const [desktopWarningOpen, setDesktopWarningOpen] = useState(false);

  const [selectedLabelIDs, setSelectedLabelIDs] = useState<string[]>();
  const [selectedFolderIDs, setSelectedFolderIDs] = useState<string[]>();
  const [selectedDateRange, setSelectedDateRange] = useState<EmailImportDateRange>();
  const [importID, setImportID] = useState<string | null>(null);
  const [createImportSession] = useCreateImportSessionMutation();

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
  // credits from outlook import
  const { data: creditsData, loading: creditsDataLoading } = useGetCreditsQuery({
    variables: {
      request: {
        entityID: userID,
        entityType: EntityType.User,
        include: [CreditInfo.CreditsFromOutlookImport]
      }
    }
  });
  const { credits: creditsResponse } = creditsData || {};
  const creditInfo = creditsResponse?.credits || [];
  const didEarnCreditsFromOutlookImport = !!getCreditCentsForInfoType(creditInfo, CreditInfo.CreditsFromOutlookImport);

  const [grantCredits] = useGrantCreditsMutation();
  const [getOutlookCategoriesAndFolders] = useGetOutlookCategoriesAndFoldersLazyQuery({ fetchPolicy: 'no-cache' });
  const [startOutlookImport] = useEnableOutlookImportMutation();

  // check if there is an Outlook auth code in the query params
  const { authCode: outlookAuthClientCode, state: outlookStateCode } = getOutlookCodeInURL();

  const clearOutlookAuthCode = useCallback(() => {
    // clean code query params
    if (outlookAuthClientCode) {
      clearAuthCodes(ImportClients.Outlook);
    }

    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  }, [dispatch, outlookAuthClientCode]);

  const handleOutlookAuth = useCallback(async () => {
    await signIntoOutlook(AuthAction.Import);

    // Since mobile app does not open outlook auth url in app (open is browser)
    // we need to reset outlook sign in state
    if (isMobileApp()) setTimeout(() => setOutlookSignInModalOpen(false), 0);
  }, [setOutlookSignInModalOpen]);

  useEffect(() => {
    if (outlookAuthClientCode && outlookStateCode) {
      createImportSession({
        variables: {
          request: {
            code: outlookAuthClientCode,
            client: ImportClients.Outlook,
            state: outlookStateCode
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
            title: 'Outlook import failed',
            body: 'Could not start import. Please try again later.'
          });
        });
      clearOutlookAuthCode();
    }
  }, [clearOutlookAuthCode, createImportSession, enqueueToast, outlookAuthClientCode]);

  const handleImportError = useCallback(
    (errorMsg: string, retryAuth: () => Promise<void>) => {
      enqueueToast({
        title: 'Outlook import failed',
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

  const handleOutlookImport = useCallback(async () => {
    // On mobile open settings drawer
    if (isMobile) {
      showSettingsDrawer();
    }

    try {
      if (!selectedDateRange) {
        // If we reach here, this is an error with our code
        console.error('Cannot start import. Missing a selected date range to import from.');
        return;
      }
      if (!importID) {
        // If we reach here, this is an error with our code
        console.error('Cannot start import. Missing import ID.');
        return;
      }
      await startOutlookImport({
        variables: {
          request: {
            importID,
            dateRange: selectedDateRange,
            includeOutlookCategoryIDs: selectedLabelIDs ?? [],
            includeOutlookFolderIDs: selectedFolderIDs ?? [],
            subscribeToAutoImport: true
          }
        }
      });
      navigateToSystemLabel(SystemLabels.Imports);
      dispatch(skemailImportReducer.actions.startImport());
      closeSettings();

      // Grant one-time credit if the user has not yet received credits from importing
      if (!didEarnCreditsFromOutlookImport) {
        void grantCredits({
          variables: {
            request: {
              creditTransactionReason: CreditTransactionReason.OutlookImport,
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
            handleImportError(graphError.message, handleOutlookAuth);
            return true;
          }
          return false;
        });
      }
    }
  }, [
    showSettingsDrawer,
    selectedDateRange,
    importID,
    startOutlookImport,
    selectedLabelIDs,
    selectedFolderIDs,
    navigateToSystemLabel,
    dispatch,
    closeSettings,
    didEarnCreditsFromOutlookImport,
    grantCredits,
    handleImportError,
    handleOutlookAuth
  ]);

  useEffect(() => {
    if (!outlookAuthClientCode) return;
    setImportMailStepsOpen(true);
  }, [outlookAuthClientCode, handleOutlookImport]);

  const fetchOutlookCategoriesAndFolders = useCallback(async () => {
    if (importID) {
      return getOutlookCategoriesAndFolders({
        variables: {
          request: {
            importID
          }
        }
      })
        .then((result): ExternalLabelsAndFoldersResult => {
          const { categories, folders } = result.data?.outlookInboxOrganization ?? {};
          return {
            externalLabels: categories,
            externalFolders: folders
          };
        })
        .catch((err) => {
          console.error('Failed to fetch Outlook categories and folders', err);
          enqueueToast({
            title: 'Failed to fetch Outlook data',
            body: 'Could not get Outlook categories and folders to import. Please try again later.'
          });
          return {
            externalLabels: undefined
          };
        });
    }
  }, [enqueueToast, getOutlookCategoriesAndFolders, importID]);

  const getSubLabel = () => {
    if (isDesktopApp()) return 'Access Skiff Mail through a web browser to import Outlook messages.';
    return didEarnCreditsFromOutlookImport || creditsDataLoading
      ? 'Import Outlook messages into Skiff.'
      : 'Earn $10 of credit when you import from Outlook.';
  };

  const getDefaultSelectedLabelIDs = useCallback((categories?: ExternalEmailClientLabelFragment[]) => {
    // Outlook default creates 6 categories for each account
    // Do not auto-select these categories on default -- otherwise if you are on the free plan,
    // you will always be over the limit, as the max is 5
    const nonDefaultOutlookCategories =
      categories?.filter((category) => !DEFAULT_OUTLOOK_CATEGORIES.includes(category.labelName)) ?? [];
    return nonDefaultOutlookCategories.map((category) => category.labelID);
  }, []);

  const importActionLabel = 'Import your Outlook messages to Skiff';

  return (
    <>
      <ImportSelect
        dataTest='outlook-mail-import'
        icon={Icon.Outlook}
        iconColor='source'
        label='Outlook'
        onClick={() => {
          if (isDesktopApp()) {
            setDesktopWarningOpen(true);
            return;
          }
          setOutlookSignInModalOpen(true);
        }}
        subLabel={getSubLabel()}
        wrap
      />
      <SignIntoOutlook
        actionLabel={importActionLabel}
        handleOutlookAuth={handleOutlookAuth}
        onClose={() => {
          setOutlookSignInModalOpen(false);
        }}
        open={outlookSignInModalOpen}
      />
      <ImportMailStepsModal
        fetchExternalLabelsAndFolders={fetchOutlookCategoriesAndFolders}
        getDefaultSelectedIDs={useMemo(
          () => ({
            labels: getDefaultSelectedLabelIDs
          }),
          [getDefaultSelectedLabelIDs]
        )}
        importClient={ImportClients.Outlook}
        importID={importID ?? undefined}
        onClose={() => {
          setImportMailStepsOpen(false);
        }}
        onStartImport={handleOutlookImport}
        open={!!importMailStepsOpen}
        selectedDateRange={selectedDateRange}
        selectedFolderIDs={selectedFolderIDs}
        selectedLabelIDs={selectedLabelIDs}
        setSelectedDateRange={setSelectedDateRange}
        setSelectedFolderIDs={setSelectedFolderIDs}
        setSelectedLabelIDs={setSelectedLabelIDs}
      />
      <DesktopWarningModal
        actionLabel={importActionLabel}
        onClose={() => {
          setDesktopWarningOpen(false);
        }}
        open={desktopWarningOpen}
        providerIcon={Icon.Outlook}
        providerLabel='Outlook'
      />
    </>
  );
};
