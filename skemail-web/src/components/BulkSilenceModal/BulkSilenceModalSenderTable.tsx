import {
  CircularProgress,
  Dropdown,
  DropdownItem,
  FilledVariant,
  Icon,
  IconText,
  Size,
  Typography,
  TypographySize,
  TypographyWeight
} from 'nightwatch-ui';
import { useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { Checkbox } from 'skiff-front-utils';
import styled, { css } from 'styled-components';

import { UnsubscribeSortLabels } from './BulkSilenceModal.constants';
import { CheckboxContainer, OneThirdCol, TwoThirdCol } from './BulkSilenceModal.styles';
import { BulkSilenceModalSenderTableProps, BulkSilenceSortLabel, BulkSilenceSortMode } from './BulkSilenceModal.types';
import BulkSilenceSenderSection from './BulkSilenceSenderSection';

const SenderTable = styled.div<{ $noContainer?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  ${(props) =>
    !props?.$noContainer &&
    css`
      height: 50vh;
      max-height: 512px;
    `}

  border-radius: ${({ $noContainer }) => ($noContainer ? '0' : '8px')};
  border: ${({ $noContainer }) => ($noContainer ? 'none' : '1px solid var(--border-secondary)')};
`;

const SenderTableScroll = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;

  ${!isMobile &&
  css`
    ::-webkit-scrollbar-thumb {
      background: transparent;
    }
    :hover::-webkit-scrollbar-thumb {
      background: var(--border-primary);
      border-radius: 20px;
      border: 3px solid transparent;
      background-clip: content-box;
    }
  `}
`;

const SenderTableContainer = styled.div<{ $noContainer?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: ${({ $noContainer }) => ($noContainer ? '0' : '0px 20px')};
  box-sizing: border-box;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const SenderTableHeader = styled.div<{ $noContainer?: boolean }>`
  display: flex;
  align-items: center;
  padding: ${({ $noContainer }) => ($noContainer ? '0' : '12px')};
`;

/**
 * Component for the sender table in the bulk unsubscribe modal.
 */
const BulkSilenceModalSenderTable = (props: BulkSilenceModalSenderTableProps) => {
  const { checkedItems, setCheckedItems, loadingSuggestions, sections, noContainer } = props;
  const [sortMode, setSortMode] = useState<BulkSilenceSortMode | null>(null);

  const [openSortDropdown, setOpenSortDropdown] = useState(false);

  const handleToggleAll = () => {
    if (!setCheckedItems || !checkedItems) return;
    const allChecked = Object.values(checkedItems).every((value) => value);
    const newCheckedState = {
      ...Object.fromEntries(Object.keys(checkedItems).map((key) => [key, !allChecked]))
    };
    setCheckedItems(newCheckedState);
  };

  const sortRef = useRef<HTMLDivElement>(null);

  const activeSortOption: BulkSilenceSortLabel | undefined = sortMode ? UnsubscribeSortLabels[sortMode] : undefined;
  return (
    <SenderTableContainer $noContainer={noContainer}>
      <SenderTable $noContainer={noContainer}>
        <SenderTableHeader $noContainer={noContainer}>
          <TwoThirdCol>
            {checkedItems !== undefined && (
              <CheckboxContainer onClick={handleToggleAll}>
                <Checkbox
                  checked={!!Object.values(checkedItems).length && Object.values(checkedItems).every((value) => value)}
                  onClick={handleToggleAll}
                />
              </CheckboxContainer>
            )}
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL}>
              Sender
            </Typography>
          </TwoThirdCol>
          <OneThirdCol>
            <Typography color='disabled' mono selectable={false} size={TypographySize.SMALL}>
              Messages
            </Typography>
          </OneThirdCol>
          <OneThirdCol>
            <IconText
              endIcon={Icon.ChevronDown}
              label={activeSortOption?.label || 'Sort by'}
              onClick={() => {
                setOpenSortDropdown((prev) => !prev);
              }}
              ref={sortRef}
              variant={FilledVariant.FILLED}
              weight={TypographyWeight.REGULAR}
            />
            <Dropdown
              buttonRef={sortRef}
              gapFromAnchor={6}
              portal
              setShowDropdown={setOpenSortDropdown}
              showDropdown={openSortDropdown}
            >
              {Object.keys(UnsubscribeSortLabels).map((option: string, index: number) => {
                const sortOption: BulkSilenceSortLabel = UnsubscribeSortLabels[option as BulkSilenceSortMode];
                return (
                  <DropdownItem
                    active={sortOption?.label === activeSortOption?.label || (!activeSortOption && index === 1)}
                    icon={sortOption?.icon}
                    key={sortOption?.key}
                    label={sortOption?.label}
                    onClick={() => {
                      setOpenSortDropdown(false);
                      setSortMode(option as BulkSilenceSortMode);
                    }}
                  />
                );
              })}
            </Dropdown>
          </OneThirdCol>
        </SenderTableHeader>
        {loadingSuggestions && (
          <LoadingContainer>
            <CircularProgress size={Size.MEDIUM} spinner />
          </LoadingContainer>
        )}
        {!loadingSuggestions && (
          <SenderTableScroll>
            {sections
              .filter((section) => !section?.hide)
              .map((section) => (
                <BulkSilenceSenderSection
                  bulkSilenceData={section.bulkSilenceData}
                  checkedItems={checkedItems}
                  emptyText={section?.emptyText}
                  sectionLabel={section.sectionLabel}
                  setCheckedItems={setCheckedItems}
                  sortMode={sortMode || BulkSilenceSortMode.NumEmails}
                />
              ))}
          </SenderTableScroll>
        )}
      </SenderTable>
    </SenderTableContainer>
  );
};

export default BulkSilenceModalSenderTable;
