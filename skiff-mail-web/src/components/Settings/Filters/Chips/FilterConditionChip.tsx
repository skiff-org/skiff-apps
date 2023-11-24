import toLower from 'lodash/toLower';
import { Dropdown, DropdownItem, Icon, Icons, Size, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import React, { useRef, useState } from 'react';
import {
  AddressObjectWithDisplayPicture,
  UserAvatar,
  abbreviateWalletAddress,
  createAbbreviatedWalletEmail,
  splitEmailToAliasAndDomain
} from 'skiff-front-utils';
import { isWalletAddress } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { ConditionTypeDropdown } from '../Dropdowns/ConditionTypeDropdown';
import { FilterValueDropdown } from '../Dropdowns/FilterValueDropdown';
import {
  CHIP_TYPOGRAPHY_PADDING,
  CONDITION_TYPE_TO_LABEL,
  ConditionComparator,
  ConditionType,
  DROPDOWN_ANCHOR_GAP,
  FILTER_CONDITION_CHIP_EDGE_PADDING,
  FilterChipDropdown,
  CONDITION_TYPE_TO_COMPARATORS
} from '../Filters.constants';
import { Condition, isAddressType, isContactConditionValue, ConditionValue } from '../Filters.types';

import { ChipContainer, ChipTypography, labelStyling } from './Chips.styles';

export const TypeLabel = styled.div<{ $canEdit: boolean; $emphasize?: boolean }>`
  ${labelStyling}
  padding: 0 ${CHIP_TYPOGRAPHY_PADDING}px 0 ${FILTER_CONDITION_CHIP_EDGE_PADDING + CHIP_TYPOGRAPHY_PADDING}px;
  border-top-left-radius: 32px;
  border-bottom-left-radius: 32px;
  border-right: 1px var(--border-secondary) solid;
`;

const ComparatorLabel = styled.div<{ $canEdit: boolean }>`
  ${labelStyling}
  padding: 0 ${CHIP_TYPOGRAPHY_PADDING}px;
  border-right: 1px var(--border-secondary) solid;
`;

const ValueLabel = styled.div<{ $canEdit: boolean }>`
  ${labelStyling}
  min-width: 0;
  display: flex;
  ${({ $canEdit }) =>
    $canEdit
      ? css`
          border-right: 1px var(--border-secondary) solid;
          flex-direction: row-reverse;
        `
      : `padding-right: ${FILTER_CONDITION_CHIP_EDGE_PADDING}px;`}
`;

const UserAvatarContainer = styled.div<{ $canEdit: boolean }>`
  ${({ $canEdit }) => ($canEdit ? `padding-left: ${FILTER_CONDITION_CHIP_EDGE_PADDING}px;` : `padding-right: 0px;`)};
`;

export const FilterChipCloseIcon = styled.div`
  padding: 0px ${CHIP_TYPOGRAPHY_PADDING}px 0px ${FILTER_CONDITION_CHIP_EDGE_PADDING}px;
  height: 100%;
  display: flex;
  align-items: center;
  border-top-right-radius: 32px;
  border-bottom-right-radius: 32px;
  cursor: pointer;

  &:hover {
    background: var(--cta-chip-hover);
  }
`;

const ConditionConnector = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 2px; // not a multiple of 4, to center the mono text
`;

interface FilterConditionChipProps {
  condition: Condition;
  editChipHelpers?: {
    deleteChip: () => void;
    updateCondition: (updatedCondition: Partial<Condition>) => void;
    contactList?: AddressObjectWithDisplayPicture[];
    openDropdown?: FilterChipDropdown;
    isNew?: boolean;
  };
  includeConnector?: boolean;
  shouldORFilters?: boolean;
}

export const FilterConditionChip: React.FC<FilterConditionChipProps> = ({
  condition,
  editChipHelpers,
  includeConnector,
  shouldORFilters
}: FilterConditionChipProps) => {
  const { type, comparator, value } = condition;
  const valueIsContact = isContactConditionValue(value);
  const typeIsAddress = isAddressType(type); // Condition is of type "From" or "To"
  const canEdit = !!editChipHelpers;

  const defaultValue = valueIsContact ? value.value : value ?? '';
  const [valueSearch, setValueSearch] = useState(defaultValue);

  const [showTypeDropdown, setShowTypeDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Type : false
  );
  const [showComparatorDropdown, setShowComparatorDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Comparator : false
  );
  const [showValueDropdown, setShowValueDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Value : false
  );

  const typeRef = useRef<HTMLDivElement>(null);
  const comparatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const comparatorOptions = CONDITION_TYPE_TO_COMPARATORS[type];

  const getPlaceholderText = () => {
    switch (type) {
      case ConditionType.To:
      case ConditionType.From:
        return 'email';
      case ConditionType.Body:
      case ConditionType.Subject:
        return 'word or phrase';
      default:
        return '';
    }
  };

  const renderTypeOptionsDropdown = () =>
    canEdit && (
      <ConditionTypeDropdown
        buttonRef={typeRef}
        isTypeActive={(currType) => currType === type}
        onClickConditionType={(selectedType) => {
          const selectedTypedComparatorOptions = CONDITION_TYPE_TO_COMPARATORS[selectedType];
          const nextOpenDropdown =
            selectedTypedComparatorOptions.length > 1 ? FilterChipDropdown.Comparator : FilterChipDropdown.Value;
          editChipHelpers.updateCondition({
            type: selectedType,
            // Only auto open dropdown if the condition is new
            openDropdown: editChipHelpers.isNew ? nextOpenDropdown : undefined,
            comparator: !selectedTypedComparatorOptions.includes(comparator)
              ? selectedTypedComparatorOptions[0]
              : comparator
          });
        }}
        setShowDropdown={setShowTypeDropdown}
        showDropdown={showTypeDropdown}
      />
    );

  const renderComparatorOptionsDropdown = () => {
    const setShowDropdown = (open: boolean) => {
      if (!open) {
        // Only auto open dropdown if the condition is new and if we are closing the dropdown
        editChipHelpers?.updateCondition({
          openDropdown: editChipHelpers.isNew ? FilterChipDropdown.Value : undefined
        });
      }
      setShowComparatorDropdown(open);
    };

    return (
      canEdit && (
        <Dropdown
          buttonRef={comparatorRef}
          gapFromAnchor={DROPDOWN_ANCHOR_GAP}
          portal
          setShowDropdown={setShowDropdown}
          showDropdown={showComparatorDropdown}
        >
          {comparatorOptions.map((comp) => (
            <DropdownItem
              active={comparator === comp}
              key={comp}
              label={toLower(comp)}
              onClick={() => {
                editChipHelpers.updateCondition({
                  comparator: comp,
                  // Only auto open dropdown if the condition is new
                  openDropdown: editChipHelpers.isNew ? FilterChipDropdown.Value : undefined
                });
                setShowComparatorDropdown(false);
              }}
              value={comp}
            />
          ))}
        </Dropdown>
      )
    );
  };

  const renderValueDropdown = () => {
    if (!canEdit) return null;
    // Checks whether or not the contact is currently selected
    const isContactOptionActive = (contact: AddressObjectWithDisplayPicture, label: string) =>
      valueIsContact && value.label === label && value.value === contact.address;

    const updateConditionValue = (newValue: ConditionValue | undefined) => {
      editChipHelpers.updateCondition({ value: newValue, openDropdown: undefined });
      setShowValueDropdown(false);
    };

    const onContactSelect = (contact: AddressObjectWithDisplayPicture) => {
      const { address, displayPictureData, name } = contact;
      const label = name ?? address;
      updateConditionValue({ label, value: address, displayPictureData });
      setValueSearch(label);
    };

    // Submit inputted search value
    const onInputSubmit = () => {
      const trimmedSearch = valueSearch.trim();
      updateConditionValue(trimmedSearch);
      setValueSearch(trimmedSearch);
    };

    return (
      <FilterValueDropdown
        buttonRef={valueRef}
        contactList={editChipHelpers?.contactList}
        defaultValue={defaultValue}
        isContactOptionActive={isContactOptionActive}
        onContactSelect={onContactSelect}
        onInputSubmit={onInputSubmit}
        search={valueSearch}
        setSearch={setValueSearch}
        setShowDropdown={(open: boolean) => {
          setShowValueDropdown(open);
          if (open) return;
          // Reset / submit the search value on closing the dropdown by clicking outside
          if (typeIsAddress) {
            // For To/From address condition types,
            // do not auto submit the search term on clicking outside of the dropdown
            // and, instead, reset to the default
            if (valueSearch !== defaultValue) setValueSearch(defaultValue);
          } else {
            // Otherwise, for options without suggestions, submit the inputted value
            onInputSubmit();
          }
        }}
        showDropdown={showValueDropdown}
        typeIsAddress={typeIsAddress}
        value={value}
      />
    );
  };

  const onLabelClick = (setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>, canEditLabel: boolean) => {
    return canEditLabel
      ? () => {
          setShowDropdown((prev) => !prev);
        }
      : undefined;
  };

  const getDisplayValue = () => {
    // If the value is a contact, it has a label + value. Otherwise it is just a string
    const valueLabel = valueIsContact ? value.label : value;
    if (!valueLabel) return getPlaceholderText();
    const { alias, domain } = splitEmailToAliasAndDomain(valueLabel ?? '');
    if (isWalletAddress(alias)) return createAbbreviatedWalletEmail(alias, domain);
    if (isWalletAddress(valueLabel)) return abbreviateWalletAddress(valueLabel);
    return !typeIsAddress ? `"${valueLabel}"` : valueLabel;
  };

  // Only render the user avatar if the value is a contact with a profile picture
  // and the comparator is not "Includes" (since the value can be free text)
  const shouldRenderUserAvatar = valueIsContact && value.displayPictureData && comparator !== ConditionComparator.Has;

  const canEditComparator = canEdit && comparatorOptions.length > 1;

  return (
    <>
      <ChipContainer $canEdit={canEdit}>
        <TypeLabel $canEdit={canEdit} onClick={onLabelClick(setShowTypeDropdown, canEdit)} ref={typeRef}>
          <Typography color='secondary'>{CONDITION_TYPE_TO_LABEL[type]}</Typography>
        </TypeLabel>
        <ComparatorLabel
          $canEdit={canEditComparator}
          onClick={onLabelClick(setShowComparatorDropdown, canEditComparator)}
          ref={comparatorRef}
        >
          <Typography color='secondary'>{toLower(comparator)}</Typography>
        </ComparatorLabel>
        <ValueLabel $canEdit={canEdit} onClick={onLabelClick(setShowValueDropdown, canEdit)} ref={valueRef}>
          <ChipTypography>
            <Typography
              color={value ? 'primary' : 'disabled'}
              weight={value ? TypographyWeight.MEDIUM : TypographyWeight.REGULAR}
            >
              {getDisplayValue()}
            </Typography>
          </ChipTypography>
          {shouldRenderUserAvatar && (
            <UserAvatarContainer $canEdit={canEdit}>
              <UserAvatar
                displayPictureData={value.displayPictureData}
                label={value.label}
                rounded
                size={Size.X_SMALL}
              />
            </UserAvatarContainer>
          )}
        </ValueLabel>
        {canEdit && (
          <FilterChipCloseIcon onClick={editChipHelpers.deleteChip}>
            <Icons color='disabled' icon={Icon.Close} size={Size.SMALL} />
          </FilterChipCloseIcon>
        )}
      </ChipContainer>
      {includeConnector && shouldORFilters !== undefined && (
        <ConditionConnector>
          <Typography color='disabled' mono size={TypographySize.CAPTION} uppercase weight={TypographyWeight.MEDIUM}>
            {shouldORFilters ? 'or' : 'and'}
          </Typography>
        </ConditionConnector>
      )}
      {renderTypeOptionsDropdown()}
      {renderComparatorOptionsDropdown()}
      {renderValueDropdown()}
    </>
  );
};
