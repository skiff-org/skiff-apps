import { ImportClients } from 'skiff-graphql';

export enum ImportMailStep {
  SELECT_TIME_FRAME = 'SelectTimeFrame',
  SELECT_LABELS = 'SelectLabels',
  SELECT_FOLDERS = 'SelectFolders',
  CONFIRM_IMPORT = 'ConfirmImport'
}

export enum TimeFrameOption {
  ONE_MONTH = 'Last 1 month',
  THREE_MONTHS = 'Last 3 months',
  TWELVE_MONTHS = 'Last 12 months',
  EVERYTHING = 'Import everything',
  CUSTOM = 'Custom'
}

const gmailImportSteps = [
  ImportMailStep.SELECT_TIME_FRAME,
  ImportMailStep.SELECT_LABELS,
  ImportMailStep.CONFIRM_IMPORT
];

const outlookImportSteps = [
  ImportMailStep.SELECT_TIME_FRAME,
  ImportMailStep.SELECT_FOLDERS,
  ImportMailStep.SELECT_LABELS,
  ImportMailStep.CONFIRM_IMPORT
];

export interface ImportConfig {
  steps: ImportMailStep[];
  labelText?: string;
}

export const IMPORT_CONFIGS: Record<ImportClients.Gmail | ImportClients.Outlook, ImportConfig> = {
  [ImportClients.Gmail]: {
    steps: gmailImportSteps
  },
  [ImportClients.Outlook]: {
    steps: outlookImportSteps,
    labelText: 'categories'
  }
};
