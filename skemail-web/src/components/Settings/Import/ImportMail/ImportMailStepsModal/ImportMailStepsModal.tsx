import { DRAWER_CLASSNAME, Dialog } from 'nightwatch-ui';
import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { ExternalEmailClientLabelFragment, useSubscriptionPlan, useUserLabelsQuery } from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION, ExceededItem, SelectItemType, UpgradeModal } from 'skiff-front-utils';
import {
  EmailImportDateRange,
  ImportClients,
  WorkspaceEventType,
  getTierNameFromSubscriptionPlan
} from 'skiff-graphql';
import { TierName, getMaxNumLabelsOrFolders } from 'skiff-utils';

import client from '../../../../../apollo/client';
import { splitUserLabelsByVariant, userLabelFromGraphQL } from '../../../../../utils/label';
import { storeWorkspaceEvent } from '../../../../../utils/userUtils';

import { ConfirmImport } from './ConfirmImport';
import { IMPORT_CONFIGS, ImportConfig, ImportMailStep } from './ImportMailStepsModal.constants';
import { ExternalLabelsAndFoldersResult, NumCustomLabelsAndFolders } from './ImportMailStepsModal.types';
import { SelectFolders } from './SelectFolders';
import { SelectLabels } from './SelectLabels';
import { SelectTimeFrame } from './SelectTimeFrame';

interface ImportMailStepsModalProps {
  importID: string | undefined;
  fetchExternalLabelsAndFolders: () => Promise<ExternalLabelsAndFoldersResult | undefined>;
  importClient: ImportClients;
  onClose: () => void;
  onStartImport: () => Promise<void>;
  open: boolean;
  selectedDateRange: EmailImportDateRange | undefined;
  setSelectedDateRange: Dispatch<SetStateAction<EmailImportDateRange | undefined>>;
  selectedFolderIDs?: string[];
  selectedLabelIDs?: string[];
  setSelectedFolderIDs?: Dispatch<SetStateAction<string[] | undefined>>;
  setSelectedLabelIDs?: Dispatch<SetStateAction<string[] | undefined>>;
  getDefaultSelectedIDs?: {
    labels?: (labels?: ExternalEmailClientLabelFragment[]) => string[];
    folders?: (folders?: ExternalEmailClientLabelFragment[]) => string[];
  };
}

export const ImportMailStepsModal: React.FC<ImportMailStepsModalProps> = ({
  importID,
  fetchExternalLabelsAndFolders,
  importClient,
  onClose,
  onStartImport,
  open,
  selectedDateRange,
  setSelectedDateRange,
  selectedFolderIDs,
  selectedLabelIDs,
  setSelectedFolderIDs,
  setSelectedLabelIDs,
  getDefaultSelectedIDs
}: ImportMailStepsModalProps) => {
  const {
    loading: subscriptionLoading,
    data: { activeSubscription }
  } = useSubscriptionPlan();
  const planTier = getTierNameFromSubscriptionPlan(activeSubscription);

  const { data, loading: userLabelsLoading } = useUserLabelsQuery();
  const { labels: currLabels, folders: currFolders } = splitUserLabelsByVariant(
    data?.userLabels?.map(userLabelFromGraphQL) ?? []
  );

  const [externalData, setExternalData] = useState<ExternalLabelsAndFoldersResult>({
    externalLabels: undefined,
    externalFolders: undefined
  });
  const [externalDataLoading, setExternalDataLoading] = useState(false);
  const [numCustomSelected, setNumCustomSelected] = useState<NumCustomLabelsAndFolders>({
    numCustomLabels: undefined,
    numCustomFolders: undefined
  });

  const allSteps = useMemo(
    () => (importClient && (IMPORT_CONFIGS[importClient] as ImportConfig).steps) || [],
    [importClient]
  );
  const [step, setStep] = useState<ImportMailStep>();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Track if we are importing more labels or folders than the current plan allows for
  const maxAllowed = getMaxNumLabelsOrFolders(planTier);
  const maxAllowedCustomLabels = Math.max(maxAllowed - currLabels.length, 0);
  const maxAllowedCustomFolders = Math.max(maxAllowed - currFolders.length, 0);
  const getExceededItems = () => {
    const { numCustomLabels, numCustomFolders } = numCustomSelected;
    const items: { [key in keyof SelectItemType]?: ExceededItem } = {};
    if (numCustomLabels && numCustomLabels > maxAllowedCustomLabels) {
      items[SelectItemType.LABEL] = {
        maxAllowed,
        numSelected: numCustomLabels
      };
    }
    if (numCustomFolders && numCustomFolders > maxAllowedCustomFolders) {
      items[SelectItemType.FOLDER] = {
        maxAllowed,
        numSelected: numCustomFolders
      };
    }
    return items;
  };
  const exceededItems = getExceededItems();
  const shouldUpgradeBeforeImport = !!Object.keys(exceededItems).length;

  // Initialize to the first step when you open the modal
  useEffect(() => {
    if (open) setStep(allSteps[0]);
  }, [allSteps, open]);

  // Fetch and set external labels and folders
  useEffect(() => {
    const getExternalLabelsAndFolders = async () => {
      setExternalDataLoading(true);
      await fetchExternalLabelsAndFolders()
        .then((results) => {
          setExternalData({
            externalLabels: results?.externalLabels,
            externalFolders: results?.externalFolders
          });
          // Reset selected values since we've fetched new labels and folders
          setSelectedLabelIDs?.(getDefaultSelectedIDs?.labels?.(results?.externalLabels));
          setSelectedFolderIDs?.(getDefaultSelectedIDs?.folders?.(results?.externalFolders));
          setExternalDataLoading(false);
        })
        .catch((error) => {
          console.error(`Could not fetch labels and/or folders from ${importClient}.`, error);
          // On error, don't set the external labels or folders. In this case, we will skip the
          // steps that rely on the external labels and folders.
          setExternalDataLoading(false);
        });
    };
    // When we open the modal, fetch the external labels and folders
    if (open) void getExternalLabelsAndFolders();
  }, [
    fetchExternalLabelsAndFolders,
    importClient,
    open,
    setSelectedFolderIDs,
    setSelectedLabelIDs,
    getDefaultSelectedIDs
  ]);

  const openUpgradeModal = () => {
    setUpgradeModalOpen(true);
    void storeWorkspaceEvent(WorkspaceEventType.ImportUpgradeModalShown, importClient, DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const setNextStep = () => {
    const currStepIndex = allSteps.findIndex((importStep) => importStep === step);
    const nextStepIndex = currStepIndex + 1;
    const currStep = allSteps[currStepIndex];
    const nextStep = allSteps[nextStepIndex];

    // If the user has exceeded their plan limits and we are on the select
    // labels or folders steps (the only ways you can exceed limits), open the upgrade modal.
    if (
      shouldUpgradeBeforeImport &&
      (currStep === ImportMailStep.SELECT_FOLDERS || currStep === ImportMailStep.SELECT_LABELS)
    ) {
      openUpgradeModal();
      return;
    }

    // If the current step is already the last step, close the modal,
    // reset the steps to the first step, and call the onStartImport callback
    if (nextStepIndex >= allSteps.length) {
      onClose();
      setStep(allSteps[0]);
      void onStartImport();
      return;
    }

    if (nextStep) {
      setStep(nextStep);
      void storeWorkspaceEvent(
        WorkspaceEventType.ImportStepContinue,
        `${importClient}-${allSteps[currStepIndex] ?? ''}`,
        DEFAULT_WORKSPACE_EVENT_VERSION
      );
    }
  };

  const goBack = () => {
    const currStepIndex = allSteps.findIndex((importStep) => importStep === step);
    const prevStepIndex = currStepIndex - 1;
    if (prevStepIndex < 0) {
      console.warn('Cannot go back to the previous step, already at the beginning of the step sequence.');
      return;
    }
    const prevStep = allSteps[prevStepIndex];
    if (prevStep !== undefined) setStep(prevStep);
  };

  const { externalLabels, externalFolders } = externalData;
  // If we are no longer loading external data but externalLabels/Folders is undefined,
  // this means there has been an error in fetching them. If there are legitimately
  // no labels or folders, externalLabels/Folders would be an empty list
  const skipSelectLabelStep = !externalDataLoading && !externalLabels;
  const skipSelectFolderStep = !externalDataLoading && !externalFolders;

  const getUpgradeModalDescription = () => {
    const didNotExceedPlanLimits = !Object.keys(exceededItems).length;
    const didExceedLabels = SelectItemType.LABEL in exceededItems;
    const didExceedFolders = SelectItemType.FOLDER in exceededItems;
    let description = '';
    if (planTier === TierName.Free) {
      description = `Your Free plan allows for ${didNotExceedPlanLimits || didExceedLabels ? '5 labels' : ''}${
        didNotExceedPlanLimits || (didExceedLabels && didExceedFolders) ? ' and ' : ''
      }${didNotExceedPlanLimits || didExceedFolders ? '5 folders' : ''}. `;
    }

    return `${description}Enjoy unlimited labels and folders by upgrading to Skiff Essential or Pro.`;
  };

  const setNumCustomSelectedLabels = useCallback((numCustomSelectedLabels: number) => {
    setNumCustomSelected((prev) => ({
      ...prev,
      numCustomLabels: numCustomSelectedLabels
    }));
  }, []);

  const setNumCustomSelectedFolders = useCallback((numCustomSelectedFolders: number) => {
    setNumCustomSelected((prev) => ({
      ...prev,
      numCustomFolders: numCustomSelectedFolders
    }));
  }, []);

  return (
    <Dialog
      classesToIgnore={isMobile ? [DRAWER_CLASSNAME] : undefined} // on mobile, do not close the modal when clicking within a drawer
      customContent
      hideCloseButton
      onClose={onClose}
      open={open}
      progress={{
        totalNumSteps: allSteps.length,
        currStep: allSteps.findIndex((val) => val === step)
      }}
      zIndex={isMobile ? 1200 : undefined} // to ensure the date picker drawer is on top on the modal
    >
      {step === ImportMailStep.SELECT_TIME_FRAME && (
        <SelectTimeFrame
          importClient={importClient}
          importID={importID}
          loading={subscriptionLoading}
          onClose={onClose}
          onContinue={setNextStep}
          openUpgradeModal={openUpgradeModal}
          planTier={planTier}
          setSelectedDateRange={setSelectedDateRange}
        />
      )}
      {setSelectedLabelIDs && !skipSelectLabelStep && step === ImportMailStep.SELECT_LABELS && (
        <SelectLabels
          defaultSelectAll={getDefaultSelectedIDs?.labels === undefined}
          externalLabelsData={{
            loading: externalDataLoading || subscriptionLoading || userLabelsLoading,
            externalLabels: externalData.externalLabels
          }}
          importClient={importClient}
          maxAllowedCustomLabels={maxAllowedCustomLabels}
          numCustomSelectedLabels={numCustomSelected.numCustomLabels ?? 0}
          onBack={goBack}
          onContinue={setNextStep}
          openUpgradeModal={openUpgradeModal}
          planTier={planTier}
          selectedLabelIDs={selectedLabelIDs}
          setNumCustomSelectedLabels={setNumCustomSelectedLabels}
          setSelectedLabelIDs={setSelectedLabelIDs}
        />
      )}
      {setSelectedFolderIDs && !skipSelectFolderStep && step === ImportMailStep.SELECT_FOLDERS && (
        <SelectFolders
          defaultSelectAll={getDefaultSelectedIDs?.folders === undefined}
          externalFoldersData={{
            loading: externalDataLoading || subscriptionLoading || userLabelsLoading,
            externalFolders: externalData.externalFolders
          }}
          importClient={importClient}
          maxAllowedCustomFolders={maxAllowedCustomFolders}
          numCustomSelectedFolders={numCustomSelected.numCustomFolders ?? 0}
          onBack={goBack}
          onContinue={setNextStep}
          openUpgradeModal={openUpgradeModal}
          planTier={planTier}
          selectedFolderIDs={selectedFolderIDs}
          setNumCustomSelectedFolders={setNumCustomSelectedFolders}
          setSelectedFolderIDs={setSelectedFolderIDs}
        />
      )}
      {step === ImportMailStep.CONFIRM_IMPORT && (
        <ConfirmImport
          importClient={importClient}
          importID={importID}
          onBack={goBack}
          onContinue={setNextStep}
          selectedDateRange={selectedDateRange}
        />
      )}
      <UpgradeModal
        client={client}
        description={getUpgradeModalDescription()}
        exceededItems={exceededItems}
        onClose={() => setUpgradeModalOpen(false)}
        open={upgradeModalOpen}
      />
    </Dialog>
  );
};
