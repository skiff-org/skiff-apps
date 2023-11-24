import startCase from 'lodash/startCase';
import {
  ButtonGroup,
  ButtonGroupItem,
  CircularProgress,
  DISPLAY_SCROLLBAR_CSS,
  Icon,
  IconText,
  IconTextProps,
  Icons,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import pluralize from 'pluralize';
import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Checkbox } from 'skiff-front-utils';
import { ImportClients } from 'skiff-graphql';
import { TierName } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { SystemLabel, UserLabelPlain, UserLabelFolder } from '../../../../../utils/label';

import { ImportMailStepHeader } from './ImportMailStepHeader';
import { ExternalItem } from './ImportMailStepsModal.types';
import { UpgradeText } from './UpgradeText';

const LoadingContainer = styled.div`
  padding: 16px;
  display: flex;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
`;

const LabelSelection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 4px 0;
  box-sizing: border-box;
  border: 1px solid var(--border-secondary);
  border-radius: 8px;
`;

const gridContainerStyles = css`
  display: grid;
  column-gap: 24px;
  grid-template-columns: 180px 20px ${isMobile ? '180px' : 'auto'};
`;

const TitleRow = styled.div`
  ${gridContainerStyles}
  border-bottom: 1px solid var(--border-secondary);
  padding: 2px 16px;
`;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const LabelSelectionGridContainer = styled.div`
  overflow-y: auto;
  overflow-x: ${isMobile ? 'auto' : 'hidden'};
  max-height: calc(100vh - 320px);
  padding: 4px 0;
  ${DISPLAY_SCROLLBAR_CSS}
`;

const LabelRowContainer = styled.div`
  padding: 0 8px;
  ${isMobile && 'width: fit-content;'}
`;

const LabelRow = styled.div<{ hover: boolean }>`
  ${gridContainerStyles}
  padding: 8px;
  cursor: pointer;
  user-select: none;
  ${(props) =>
    props.hover &&
    css`
      background: var(--bg-overlay-tertiary);
      border-radius: 8px;
    `}
`;

const Title = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  width: 100%;
`;

const SelectItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ExternalLabelContainer = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  width: 100%;
  min-width: 0;
`;

const ArrowIconContainer = styled.div`
  display: flex;
  align-items: center;
`;

const SkiffLabelContainer = styled.div`
  width: 100%;
  min-width: 0;
`;

type SkiffItemType = SystemLabel | UserLabelPlain | UserLabelFolder | undefined;
export interface ItemPair<T extends SkiffItemType> {
  externalItem: ExternalItem;
  skiffItem: T;
  skiffItemIcon: IconTextProps['startIcon'];
}
interface SelectItemsProps<T extends SkiffItemType> {
  importClient: ImportClients;
  items: ItemPair<T>[];
  itemToImport: string;
  loading: boolean;
  onBack: () => void;
  onContinue: () => void;
  selectedIDs: string[] | undefined;
  setSelectedIDs: Dispatch<SetStateAction<string[] | undefined>>;
  planTier: TierName;
  numCustomSelected: number;
  openUpgradeModal: () => void;
  setNumCustomSelected: (numCustomSelected: number) => void;
  maxAllowedCustomItems: number;
  defaultSelectAll?: boolean;
}

export const SelectItems: React.FC<SelectItemsProps<SkiffItemType>> = ({
  importClient,
  items,
  itemToImport,
  loading,
  onBack,
  onContinue,
  selectedIDs,
  setSelectedIDs,
  planTier,
  numCustomSelected,
  openUpgradeModal,
  setNumCustomSelected,
  maxAllowedCustomItems,
  defaultSelectAll = true
}: SelectItemsProps<SkiffItemType>) => {
  const [hoverIndex, setHoverIndex] = useState<number>();

  const externalItems = items.map((item) => item.externalItem);

  // Custom items are non system labels -- plain labels or folders -- that do not already exist in Skiff
  const isCustomItem = (skiffItem: SkiffItemType) => !skiffItem;

  const selectAll = useCallback(() => {
    if (externalItems) {
      setSelectedIDs(externalItems.map((label) => label.id));
    }
  }, [externalItems, setSelectedIDs]);

  const clearAllSelected = () => {
    setSelectedIDs([]);
    setNumCustomSelected(0);
  };

  // After we load new items to render, we default select all
  useEffect(() => {
    if (!loading && !selectedIDs && defaultSelectAll) {
      selectAll();
    }
  }, [loading, selectAll, selectedIDs, defaultSelectAll]);

  // Every time the selectedIDs change, update the number of
  // custom items selected
  useEffect(() => {
    let numCustomItems = 0;
    items.forEach((item) => {
      if (!selectedIDs?.includes(item.externalItem.id)) return;
      if (isCustomItem(item.skiffItem)) numCustomItems += 1;
    });
    setNumCustomSelected(numCustomItems);
  }, [items, selectedIDs, setNumCustomSelected]);

  const renderTitleRow = () => {
    const allSelected = selectedIDs && selectedIDs.length === items.length;
    const someSelected = selectedIDs && selectedIDs.length > 0;
    return (
      <TitleRow>
        <SelectItem>
          <Checkbox
            checked={someSelected}
            checkedColor='link'
            indeterminate={someSelected && !allSelected}
            onClick={() => {
              if (someSelected) clearAllSelected();
              else selectAll();
            }}
          />
          <Title>
            <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>
              {importClient}
            </Typography>
          </Title>
        </SelectItem>
        {/** Blank column for alignment */}
        <div />
        <Title>
          <Typography color='disabled' mono size={TypographySize.SMALL} uppercase>
            Skiff
          </Typography>
        </Title>
      </TitleRow>
    );
  };

  const renderRow = (itemPair: ItemPair<SkiffItemType>, rowIndex: number) => {
    const { externalItem, skiffItem, skiffItemIcon } = itemPair;
    const { id: externalItemID, name: externalItemName } = externalItem;

    const selectItem = () => {
      if (!selectedIDs) return;
      if (!selectedIDs.includes(externalItemID)) {
        setSelectedIDs((prev) => [...(prev ?? []), externalItemID]);
      } else {
        setSelectedIDs((prev) => prev?.filter((id) => id !== externalItemID));
      }
    };

    const textColor = hoverIndex === rowIndex ? 'primary' : 'secondary';

    return (
      <LabelRowContainer>
        <LabelRow
          hover={hoverIndex === rowIndex}
          key={externalItemName}
          onClick={selectItem}
          onMouseLeave={() => setHoverIndex(undefined)}
          onMouseOver={() => setHoverIndex(rowIndex)}
        >
          <SelectItem>
            <Checkbox checked={selectedIDs?.includes(externalItemID)} checkedColor='link' onClick={() => {}} />
            <ExternalLabelContainer>
              <Typography color={textColor}>{externalItemName}</Typography>
            </ExternalLabelContainer>
          </SelectItem>
          <ArrowIconContainer>
            <Icons color='disabled' icon={Icon.ArrowRight} />
          </ArrowIconContainer>
          <SkiffLabelContainer>
            <IconText
              color={textColor}
              label={skiffItem?.name ?? externalItemName}
              startIcon={skiffItemIcon}
              weight={TypographyWeight.REGULAR}
            />
          </SkiffLabelContainer>
        </LabelRow>
      </LabelRowContainer>
    );
  };

  const description = `${
    maxAllowedCustomItems !== Infinity
      ? `Your ${planTier} plan allows you to add${
          !!maxAllowedCustomItems ? ' up to' : ''
        } ${maxAllowedCustomItems} more custom ${pluralize(itemToImport, maxAllowedCustomItems)}. `
      : ''
  }${startCase(itemToImport)} that contain the same name in Skiff will be merged.`;

  return (
    <>
      <ImportMailStepHeader
        description={description}
        numItems={selectedIDs?.length}
        title={`Import ${importClient} ${itemToImport}`}
      />
      {loading && (
        <LoadingContainer>
          <CircularProgress spinner />
        </LoadingContainer>
      )}
      {!loading && (
        <>
          <LabelSelection>
            {renderTitleRow()}
            <LabelSelectionGridContainer>
              {items?.map((itemPair, index) => renderRow(itemPair, index))}
            </LabelSelectionGridContainer>
          </LabelSelection>
          {maxAllowedCustomItems !== Infinity && (
            <UpgradeText
              openUpgradeModal={openUpgradeModal}
              text={`${numCustomSelected} of ${maxAllowedCustomItems} available custom ${pluralize(
                itemToImport,
                numCustomSelected
              )} selected`}
            />
          )}
        </>
      )}
      <ButtonGroup>
        <ButtonGroupItem label='Continue' onClick={onContinue} />
        <ButtonGroupItem label='Back' onClick={onBack} />
      </ButtonGroup>
    </>
  );
};
