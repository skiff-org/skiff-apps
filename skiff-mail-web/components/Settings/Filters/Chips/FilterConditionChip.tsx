import {
  DISPLAY_SCROLLBAR_CSS,
  Dropdown,
  DropdownItem,
  getThemedColor,
  Icon,
  Icons,
  InputField,
  Size,
  ThemeMode,
  Typography,
  TypographySize,
  TypographyWeight
} from '@skiff-org/skiff-ui';
import toLower from 'lodash/toLower';
import React, { ChangeEvent, useRef, useState } from 'react';
import {
  abbreviateWalletAddress,
  AddressObjectWithDisplayPicture,
  ContactsDropdownItems,
  createAbbreviatedWalletEmail,
  splitEmailToAliasAndDomain,
  UserAvatar
} from 'skiff-front-utils';
import { isWalletAddress, trimAndLowercase } from 'skiff-utils';
import styled, { css } from 'styled-components';

import { ConditionTypeDropdown } from '../Dropdowns/ConditionTypeDropdown';
import {
  CHIP_TYPOGRAPHY_PADDING,
  ConditionComparator,
  ConditionType,
  CONDITION_TYPE_TO_COMPARATORS,
  CONDITION_TYPE_TO_LABEL,
  DROPDOWN_ANCHOR_GAP,
  FilterChipDropdown,
  FILTER_CONDITION_CHIP_EDGE_PADDING
} from '../Filters.constants';
import { Condition, ConditionValue, isAddressType, isContactConditionValue } from '../Filters.types';

import { ChipContainer, ChipTypography, labelStyling } from './Chips.styles';

const TypeLabel = styled.div<{ $canEdit: boolean }>`
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

const CloseIcon = styled.div`
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

const InputFieldContainer = styled.div`
  margin-bottom: 2px;
  box-sizing: border-box;
  min-width: 220px;
  box-sizing: border-box;
  width: 320px;
`;

const ScrollContainer = styled.div<{ $themeMode: ThemeMode }>`
  overflow-y: auto;
  max-height: 400px;
  width: 100%;
  ${DISPLAY_SCROLLBAR_CSS}
`;

const ConditionConnector = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding-top: 2px; // not a multiple of 4, to center the mono text
`;

const SearchContainer = styled.div<{ $showBorder: boolean }>`
  // only add the padding-top and margin-top when there is a border
  ${({ $showBorder }) => ($showBorder ? `padding-top: 4px; margin-top: 4px;` : '')}
  box-sizing: border-box;
  width: 100%;
  * {
    overflow: hidden;
    max-width: 320px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  border-top: ${({ $showBorder }) =>
    $showBorder ? `1px solid ${getThemedColor('var(--border-tertiary)', ThemeMode.DARK)}` : 'transparent'};
`;
interface FilterConditionChipProps {
  condition: Condition;
  editChipHelpers?: {
    deleteChip: () => void;
    activeConditionTypes: ConditionType[];
    updateCondition: (updatedCondition: Partial<Condition>) => void;
    contactList?: AddressObjectWithDisplayPicture[];
    openDropdown?: FilterChipDropdown;
    isNew?: boolean;
  };
  hasFrontendMailFilteringFeatureFlag?: boolean;
  includeConnector?: boolean;
  shouldORFilters?: boolean;
}

export const FilterConditionChip: React.FC<FilterConditionChipProps> = ({
  condition,
  editChipHelpers,
  hasFrontendMailFilteringFeatureFlag,
  includeConnector,
  shouldORFilters
}: FilterConditionChipProps) => {
  const { type, comparator, value } = condition;
  const valueIsContact = isContactConditionValue(value);
  const typeIsAddress = isAddressType(type); // Condition is of type "From" or "To"
  const canEdit = !!editChipHelpers;
  const [highlightedIndex, setHighlightedIndex] = useState<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const [showTypeDropdown, setShowTypeDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Type : false
  );
  const [showComparatorDropdown, setShowComparatorDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Comparator : false
  );
  const [showValueDropdown, setShowValueDropdown] = useState(
    editChipHelpers ? editChipHelpers.openDropdown === FilterChipDropdown.Value : false
  );
  const defaultValue = valueIsContact ? value.value : value ?? '';
  const [search, setSearch] = useState(defaultValue);

  const typeRef = useRef<HTMLDivElement>(null);
  const comparatorRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLDivElement>(null);

  const dropdownTheme = ThemeMode.DARK;

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
        activeConditionTypes={editChipHelpers.activeConditionTypes}
        buttonRef={typeRef}
        hasFrontendMailFilteringFeatureFlag={hasFrontendMailFilteringFeatureFlag}
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

  const getFilteredContacts = () => {
    if (!canEdit) return undefined;
    const { contactList } = editChipHelpers;
    if (search) {
      const searchTerm = trimAndLowercase(search);
      // search through both the display names and addresses
      return contactList?.filter(
        (item) => item.name?.toLowerCase().includes(searchTerm) || item.address.toLowerCase().includes(searchTerm)
      );
    }
    return contactList;
  };

  const updateConditionValue = (newValue: ConditionValue | undefined) => {
    if (!canEdit) return;
    editChipHelpers.updateCondition({ value: newValue, openDropdown: undefined });
    setShowValueDropdown(false);
  };

  const filteredContacts = getFilteredContacts();

  const onInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedSearch = search.trim();

      const highlightedContact = filteredContacts?.[highlightedIndex || 0];
      if (highlightedContact) {
        const { name, address, displayPictureData } = highlightedContact;
        const label = name ?? address;
        const newValue = { label: label ?? address, value: address, displayPictureData };
        updateConditionValue(newValue);
      } else {
        updateConditionValue(trimmedSearch);
        setSearch(trimmedSearch);
      }
    }
  };

  const highlightInputText = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select();
  };

  const contactsContainsSearch = filteredContacts?.some((contact) => contact.address === search);

  const renderValueDropdown = () => {
    const isContactOptionActive = (contact: AddressObjectWithDisplayPicture, label: string) =>
      valueIsContact && value.label === label && value.value === contact.address;

    return (
      canEdit && (
        <Dropdown
          buttonRef={valueRef}
          gapFromAnchor={DROPDOWN_ANCHOR_GAP}
          highlightedIdx={highlightedIndex}
          maxHeight={300}
          maxWidth={330}
          numChildren={filteredContacts?.length}
          portal
          setHighlightedIdx={setHighlightedIndex}
          setShowDropdown={setShowValueDropdown}
          showDropdown={showValueDropdown}
        >
          <InputFieldContainer>
            <InputField
              autoFocus
              forceTheme={dropdownTheme}
              onBlur={() => {
                if (typeIsAddress) {
                  // For To/From address condition types, do not auto submit the search term
                  // on blur as we should a list of suggestions.
                  // If the the input search term was not submitted, reset search to the default
                  if (defaultValue !== search) setSearch(defaultValue);
                } else {
                  // Otherwise, for options without suggestions, submit inputted value on blur
                  const trimmedSearch = search.trim();
                  updateConditionValue(trimmedSearch);
                  setSearch(trimmedSearch);
                }
              }}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={highlightInputText}
              onKeyPress={onInputEnter}
              placeholder={typeIsAddress ? 'Filter emails...' : ''}
              ref={inputRef}
              size={Size.SMALL}
              value={search}
            />
          </InputFieldContainer>
          {/** For From and To email address inputs */}
          {typeIsAddress && !!filteredContacts?.length && (
            <ScrollContainer $themeMode={ThemeMode.DARK}>
              <ContactsDropdownItems
                contactOptions={filteredContacts}
                highlightedIdx={highlightedIndex}
                isOptionActive={isContactOptionActive}
                onClick={(contact, label) => {
                  const { address, displayPictureData } = contact;
                  updateConditionValue({ label: label ?? address, value: address, displayPictureData });
                  setSearch(label ?? address);
                }}
                setHighlightedIdx={setHighlightedIndex}
                theme={ThemeMode.DARK}
              />
            </ScrollContainer>
          )}
          {/**
           * Only include the search term as a dropdown item for the address (TO/FROM) types
           * since they include suggestions
           */}
          {search && !contactsContainsSearch && isAddressType(type) && (
            <SearchContainer
              $showBorder={!!filteredContacts?.length && filteredContacts.length > 0}
              onMouseOver={() => setHighlightedIndex(-1)}
            >
              <DropdownItem
                active={value === search}
                icon={Icon.Plus}
                label={`"${search}"`}
                onClick={() => {
                  updateConditionValue(search);
                }}
              />
            </SearchContainer>
          )}
        </Dropdown>
      )
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
          <Typography mono uppercase color='secondary'>
            {CONDITION_TYPE_TO_LABEL[type]}
          </Typography>
        </TypeLabel>
        <ComparatorLabel
          $canEdit={canEditComparator}
          onClick={onLabelClick(setShowComparatorDropdown, canEditComparator)}
          ref={comparatorRef}
        >
          <Typography mono uppercase color='secondary'>
            {toLower(comparator)}
          </Typography>
        </ComparatorLabel>
        <ValueLabel $canEdit={canEdit} onClick={onLabelClick(setShowValueDropdown, canEdit)} ref={valueRef}>
          <ChipTypography>
            <Typography
              mono
              uppercase
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
          <CloseIcon onClick={editChipHelpers.deleteChip}>
            <Icons color='disabled' icon={Icon.Close} size={Size.SMALL} />
          </CloseIcon>
        )}
      </ChipContainer>
      {includeConnector && shouldORFilters !== undefined && (
        <ConditionConnector>
          <Typography
            mono
            uppercase
            color='disabled'
            mono
            size={TypographySize.CAPTION}
            uppercase
            weight={TypographyWeight.MEDIUM}
          >
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
