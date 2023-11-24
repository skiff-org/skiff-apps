import { Icon, Icons, stringToColor } from 'nightwatch-ui';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { ExternalEmailClientLabelFragment } from 'skiff-front-graphql';
import { ImportClients } from 'skiff-graphql';
import { TierName } from 'skiff-utils';

import {
  userLabelFromGraphQL,
  isSystemLabel,
  SystemLabel,
  UserLabelFolder,
  LABEL_TO_SYSTEM_LABEL,
  isFolder
} from '../../../../../utils/label';

import { ExternalLabelsAndFoldersResult } from './ImportMailStepsModal.types';
import { ItemPair, SelectItems } from './SelectItems';

interface SelectFoldersProps {
  importClient: ImportClients;
  onBack: () => void;
  onContinue: () => void;
  selectedFolderIDs: string[] | undefined;
  setSelectedFolderIDs: Dispatch<SetStateAction<string[] | undefined>>;
  externalFoldersData: {
    externalFolders: ExternalLabelsAndFoldersResult['externalFolders'];
    loading: boolean;
  };
  planTier: TierName;
  openUpgradeModal: () => void;
  numCustomSelectedFolders: number;
  setNumCustomSelectedFolders: (numCustomSelectedFolders: number) => void;
  maxAllowedCustomFolders: number;
  defaultSelectAll?: boolean;
}

export const SelectFolders: React.FC<SelectFoldersProps> = ({
  importClient,
  onBack,
  onContinue,
  selectedFolderIDs,
  setSelectedFolderIDs,
  externalFoldersData,
  planTier,
  openUpgradeModal,
  numCustomSelectedFolders,
  setNumCustomSelectedFolders,
  maxAllowedCustomFolders,
  defaultSelectAll
}: SelectFoldersProps) => {
  const { externalFolders, loading } = externalFoldersData;

  // Get the corresponding Skiff folder or system label, if one exists
  const getSkiffFolder = (
    externalFolder: ExternalEmailClientLabelFragment
  ): SystemLabel | UserLabelFolder | undefined => {
    if (externalFolder.__typename === 'ExternalEmailClientSystemLabel') {
      return externalFolder.skiffSystemLabel ? LABEL_TO_SYSTEM_LABEL[externalFolder.skiffSystemLabel] : undefined;
    } else if (externalFolder.__typename === 'ExternalEmailClientUserLabel' && externalFolder.skiffUserLabel) {
      const skiffUserLabel = userLabelFromGraphQL(externalFolder.skiffUserLabel);
      return isFolder(skiffUserLabel) ? skiffUserLabel : undefined;
    }
  };

  // Need to wrap this in a useMemo because this is used as a dependency in a useEffect in SelectItems
  const externalFolderToSkiffFolderPairs: ItemPair<SystemLabel | UserLabelFolder | undefined>[] = useMemo(
    () =>
      externalFolders?.map((externalFolder) => {
        const skiffFolder = getSkiffFolder(externalFolder);
        const skiffFolderIcon =
          skiffFolder && isSystemLabel(skiffFolder) ? (
            skiffFolder.icon
          ) : (
            <Icons color={skiffFolder?.color ?? stringToColor(externalFolder.labelName)[2]} icon={Icon.FolderFilled} />
          );

        return {
          externalItem: { id: externalFolder.labelID, name: externalFolder.labelName },
          skiffItem: skiffFolder,
          skiffItemIcon: skiffFolderIcon
        };
      }) ?? [],
    [externalFolders]
  );

  return (
    <SelectItems
      defaultSelectAll={defaultSelectAll}
      importClient={importClient}
      itemToImport='folders'
      items={externalFolderToSkiffFolderPairs}
      loading={loading}
      maxAllowedCustomItems={maxAllowedCustomFolders}
      numCustomSelected={numCustomSelectedFolders}
      onBack={onBack}
      onContinue={onContinue}
      openUpgradeModal={openUpgradeModal}
      planTier={planTier}
      selectedIDs={selectedFolderIDs}
      setNumCustomSelected={setNumCustomSelectedFolders}
      setSelectedIDs={setSelectedFolderIDs}
    />
  );
};
