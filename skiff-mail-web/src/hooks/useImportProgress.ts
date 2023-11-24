import { useEffect, useCallback, useState } from 'react';
import { isIOS, isAndroid, isMacOs, isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetImportStatusQuery, useMailboxLazyQuery, useUserLabelsLazyQuery } from 'skiff-front-graphql';
import { useLocalSetting } from 'skiff-front-utils';
import { ImportStatus, SystemLabels } from 'skiff-graphql';
import { StorageTypes } from 'skiff-utils';

import { skemailImportReducer } from '../redux/reducers/importReducer';

import { useAppSelector } from './redux/useAppSelector';

// how often we check for changes in import progress
export const IMPORT_PROGRESS_UPDATE_INTERVAL = 4000; // ms

export function useImportProgress() {
  const dispatch = useDispatch();
  const {
    isImportInProgress,
    areSilencingSuggestionsGenerating,
    progress: currentImportProgress
  } = useAppSelector((state) => state.import);

  const [isPolling, setIsPolling] = useState(false);
  const { data, error, loading, startPolling, stopPolling } = useGetImportStatusQuery({
    fetchPolicy: 'no-cache'
  });

  const [fetchUserLabels] = useUserLabelsLazyQuery();
  const [fetchImportedEmails] = useMailboxLazyQuery();

  const [, setHideImportComplete] = useLocalSetting(StorageTypes.HIDE_IMPORT_COMPLETE);

  const stopQueryingOnError = useCallback(
    (e: unknown) => {
      // this is non-critical logic whose failure does not need to be communicated to the user,
      // so if it fails, we stop querying and report the error to the caller
      dispatch(
        skemailImportReducer.actions.setProgress({
          progressRetrievalError: true
        })
      );
      stopPolling();
      setIsPolling(false);
      console.error('Error in retrieving import progress', e);
    },
    [dispatch, stopPolling]
  );

  useEffect(() => {
    // Start polling if we are not already and an import starts
    if ((isImportInProgress || areSilencingSuggestionsGenerating) && !isPolling) {
      startPolling(IMPORT_PROGRESS_UPDATE_INTERVAL);
      setIsPolling(true);
    }
    // Stop polling if we are currently polling and there is no import in progress
    // e.g. if the import fails but we have began polling
    if (
      !isImportInProgress &&
      currentImportProgress?.silencingSuggestionsComplete &&
      isPolling &&
      currentImportProgress.numEmailsImported > 0
    ) {
      stopPolling();
      setIsPolling(false);
    }
  }, [
    areSilencingSuggestionsGenerating,
    currentImportProgress,
    currentImportProgress?.silencingSuggestionsComplete,
    isImportInProgress,
    isPolling,
    startPolling,
    stopPolling
  ]);

  useEffect(() => {
    if (!data?.importStatus || !data.importStatus.length || loading) {
      return;
    }
    if (error) {
      stopQueryingOnError(error.message);
      return;
    }

    const inProgressImportStatuses = data.importStatus.filter(
      (importStatus) => importStatus.status === ImportStatus.InProgress
    );

    // Imports is considered complete when the import status is "suggestions complete" or "failed"
    const areImportsComplete = !inProgressImportStatuses.length;

    // Calculate the total number of imported emails out of the import jobs that are in progress
    const numEmailsImported = inProgressImportStatuses.reduce((totalImported, importStatus) => {
      return totalImported + (importStatus?.importedEmailCount ?? 0);
    }, 0);

    const updateUserLabelsAndImportedEmails = () => {
      // Refetch the user labels, which gets the new labels created from the import
      void fetchUserLabels();

      // Refetch the newly imported emails
      void fetchImportedEmails({
        variables: {
          request: {
            label: SystemLabels.Imports,
            cursor: null,
            limit: 20,
            platformInfo: {
              isIos: isIOS,
              isAndroid,
              isMacOs,
              isMobile,
              isReactNative: !!window.ReactNativeWebView,
              isSkiffWindowsDesktop: !!window.IsSkiffWindowsDesktop
            }
          }
        }
      });
    };

    if ((!currentImportProgress || currentImportProgress.numEmailsImported === 0) && numEmailsImported > 0) {
      // When the import starts, reset the hideImportComplete state to false
      // so that we show a toast when the import is complete
      setHideImportComplete(false);
      // Import has started and emails have been imported, so we refetch the user
      // labels and imported emails to immediately update the UI
      void updateUserLabelsAndImportedEmails();
    }

    // Refetch the user labels so that all imported labels are shown in the UI
    if (areImportsComplete) {
      void fetchUserLabels();
    }

    const silencingSuggestionsComplete = !data.importStatus.some(
      (importStatus) => importStatus.status === ImportStatus.SilencingSuggestionsQuerying
    );

    dispatch(
      skemailImportReducer.actions.setProgress({
        progress: { numEmailsImported, areImportsComplete, silencingSuggestionsComplete }
      })
    );
  }, [
    currentImportProgress?.numEmailsImported,
    data,
    dispatch,
    error,
    fetchImportedEmails,
    fetchUserLabels,
    isPolling,
    loading,
    stopPolling,
    stopQueryingOnError
  ]);

  useEffect(() => {
    // Stop polling on cleanup
    return () => {
      stopPolling();
      setIsPolling(false);
    };
  }, [stopPolling]);
}
