import { ACCENT_COLOR_VALUES, AccentColor, Icon, Icons, Size, stringToColor } from 'nightwatch-ui';
import { Dispatch, SetStateAction, useMemo } from 'react';
import { ExternalEmailClientLabelFragment } from 'skiff-front-graphql';
import { ImportClients } from 'skiff-graphql';
import { TierName } from 'skiff-utils';
import styled from 'styled-components';

import { userLabelFromGraphQL, SystemLabel, UserLabelPlain, isSystemLabel } from '../../../../../utils/label';
import { LABEL_TO_SYSTEM_LABEL } from '../../../../../utils/label';
import { isPlainLabel } from '../../../../../utils/label';

import { IMPORT_CONFIGS, ImportConfig } from './ImportMailStepsModal.constants';
import { ExternalLabelsAndFoldersResult } from './ImportMailStepsModal.types';
import { ItemPair, SelectItems } from './SelectItems';

const IconColorContainer = styled.div<{ $color: string }>`
  background: ${(props) => props.$color};
  width: 16px;
  min-width: 16px;
  height: 16px;
  min-height: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface SelectLabelsProps {
  importClient: ImportClients;
  onBack: () => void;
  onContinue: () => void;
  selectedLabelIDs: string[] | undefined;
  setSelectedLabelIDs: Dispatch<SetStateAction<string[] | undefined>>;
  externalLabelsData: {
    externalLabels: ExternalLabelsAndFoldersResult['externalLabels'];
    loading: boolean;
  };
  planTier: TierName;
  openUpgradeModal: () => void;
  numCustomSelectedLabels: number;
  setNumCustomSelectedLabels: (numCustomSelectedLabels: number) => void;
  maxAllowedCustomLabels: number;
  defaultSelectAll?: boolean;
}

export const SelectLabels: React.FC<SelectLabelsProps> = ({
  importClient,
  onBack,
  onContinue,
  selectedLabelIDs,
  setSelectedLabelIDs,
  externalLabelsData,
  planTier,
  openUpgradeModal,
  numCustomSelectedLabels,
  setNumCustomSelectedLabels,
  maxAllowedCustomLabels,
  defaultSelectAll
}: SelectLabelsProps) => {
  const { externalLabels, loading } = externalLabelsData;

  // Get the corresponding Skiff label or system label, if one exists
  const getSkiffLabel = (externalLabel: ExternalEmailClientLabelFragment): SystemLabel | UserLabelPlain | undefined => {
    if (externalLabel.__typename === 'ExternalEmailClientSystemLabel') {
      return externalLabel.skiffSystemLabel ? LABEL_TO_SYSTEM_LABEL[externalLabel.skiffSystemLabel] : undefined;
    } else if (externalLabel.__typename === 'ExternalEmailClientUserLabel' && externalLabel.skiffUserLabel) {
      const skiffUserLabel = userLabelFromGraphQL(externalLabel.skiffUserLabel);
      return isPlainLabel(skiffUserLabel) ? skiffUserLabel : undefined;
    }
  };

  const getIconColorFromName = (externalLabel: ExternalEmailClientLabelFragment): AccentColor => {
    // For Outlook, there's a default purple category, which we translate to use "pink"
    if (externalLabel.labelName.toLowerCase().includes('purple')) return 'pink';
    const colorInName = Object.entries(ACCENT_COLOR_VALUES).find((color) =>
      externalLabel.labelName.toLowerCase().includes(color[0].toLowerCase())
    )?.[1]?.[2];
    return colorInName ?? stringToColor(externalLabel.labelName)[2];
  };

  // Need to wrap this in a useMemo because this is used as a dependency in a useEffect in SelectItems
  const externalLabelToSkiffLabelPairs: ItemPair<SystemLabel | UserLabelPlain | undefined>[] = useMemo(
    () =>
      externalLabels?.map((externalLabel) => {
        const skiffLabel = getSkiffLabel(externalLabel);
        const getSkiffLabelIcon = () => {
          if (skiffLabel && isSystemLabel(skiffLabel)) return skiffLabel.icon;
          const iconColor = skiffLabel?.color ?? getIconColorFromName(externalLabel);
          return (
            <IconColorContainer
              $color={
                iconColor
                  ? (ACCENT_COLOR_VALUES[iconColor] as Array<string>)?.[1] || 'var(--bg-overlay-tertiary)'
                  : 'var(--bg-overlay-tertiary)'
              }
            >
              <Icons color={iconColor} icon={Icon.Dot} size={Size.X_SMALL} />
            </IconColorContainer>
          );
        };

        return {
          externalItem: { id: externalLabel.labelID, name: externalLabel.labelName },
          skiffItem: skiffLabel,
          skiffItemIcon: getSkiffLabelIcon()
        };
      }) ?? [],
    [externalLabels]
  );

  return (
    <SelectItems
      defaultSelectAll={defaultSelectAll}
      importClient={importClient}
      itemToImport={(IMPORT_CONFIGS[importClient] as ImportConfig).labelText || 'labels'}
      items={externalLabelToSkiffLabelPairs ?? []}
      loading={loading}
      maxAllowedCustomItems={maxAllowedCustomLabels}
      numCustomSelected={numCustomSelectedLabels}
      onBack={onBack}
      onContinue={onContinue}
      openUpgradeModal={openUpgradeModal}
      planTier={planTier}
      selectedIDs={selectedLabelIDs}
      setNumCustomSelected={setNumCustomSelectedLabels}
      setSelectedIDs={setSelectedLabelIDs}
    />
  );
};
