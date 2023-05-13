import { useFlags } from 'launchdarkly-react-client-sdk';
import { Dropdown, DropdownItem, Icon, IconText, Icons, Size, Typography, TypographyWeight } from 'nightwatch-ui';
import React, { Dispatch, SetStateAction, useRef, useState } from 'react';
import { contactToAddressObject, getEnvironment, useGetAllContactsWithOrgMembers } from 'skiff-front-utils';
import { FrontendMailFilteringFeatureFlag } from 'skiff-utils';
import styled from 'styled-components';

import { FilterConditionChip } from './Chips/FilterConditionChip';
import { ConditionTypeDropdown } from './Dropdowns/ConditionTypeDropdown';
import {
  CONDITION_TYPE_TO_COMPARATORS,
  ConditionComparator,
  ConditionType,
  FILTER_CONDITION_CHIP_HEIGHT,
  FilterChipDropdown,
  FilterType
} from './Filters.constants';
import { Condition, FilterTypeOption } from './Filters.types';
import { createConditionID, getAvailableConditionTypes } from './Filters.utils';

const FILTER_TYPE_OPTIONS = [
  {
    value: FilterType.And,
    label: 'all conditions'
  },
  {
    value: FilterType.Or,
    label: 'any condition'
  }
];

export const FILTER_TYPE_TO_OPTION: { [key in FilterType]: FilterTypeOption } = FILTER_TYPE_OPTIONS.reduce<{
  [key in FilterType]: FilterTypeOption;
}>((acc, label) => {
  acc[label.value] = label;
  return acc;
}, {} as { [key in FilterType]: FilterTypeOption });

const FilterConditionChipsContainer = styled.div`
  display: flex;
  gap: 24px;
  flex-direction: column;
`;

const AndOrOptionContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AddConditionChipContainer = styled.div`
  display: flex;
  padding: 4px;
  border: 1px dashed var(--border-primary);
  border-radius: 32px;
  align-items: center;
  width: fit-content;
  cursor: pointer;
  box-sizing: border-box;
  height: ${FILTER_CONDITION_CHIP_HEIGHT}px;

  &:hover {
    background: var(--cta-chip-hover);
  }
`;

const AddConditionLabel = styled.div`
  padding: 0px 8px;
  user-select: none;
`;

const AddConditionIcon = styled.div`
  background: var(--bg-overlay-tertiary);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
`;

const Chips = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  flex-wrap: wrap;
`;

interface FilterConditionChipsProps {
  activeConditions: Condition[];
  setActiveConditions: Dispatch<SetStateAction<Condition[]>>;
  shouldORFilters: boolean;
  setShouldORFilters: Dispatch<SetStateAction<boolean>>;
}

export const FilterConditionChips: React.FC<FilterConditionChipsProps> = ({
  activeConditions,
  setActiveConditions,
  shouldORFilters,
  setShouldORFilters
}: FilterConditionChipsProps) => {
  const flags = useFlags();
  const env = getEnvironment(new URL(window.location.origin));
  const hasFrontendMailFilteringFeatureFlag =
    env === 'local' || env === 'vercel' || (flags.frontendMailFiltering as FrontendMailFilteringFeatureFlag);
  const [showConditionTypeDropdown, setShowConditionTypeDropdown] = useState(false);
  const [showOrOptionsDropdown, setShowOrOptionsDropdown] = useState(false);

  const addConditionChipRef = useRef<HTMLDivElement>(null);
  const orOptionsRef = useRef<HTMLDivElement>(null);

  const { contactsWithOrgMembers } = useGetAllContactsWithOrgMembers();
  const contactList = contactsWithOrgMembers.map(contactToAddressObject) ?? [];

  const activeConditionTypes = activeConditions.map((condition) => condition.type);
  const availableConditionTypes = getAvailableConditionTypes(hasFrontendMailFilteringFeatureFlag);
  const canAddNewCondition = availableConditionTypes.some((type) => !activeConditionTypes.includes(type));

  const addNewCondition = (type: ConditionType) => {
    const comparatorOptions = CONDITION_TYPE_TO_COMPARATORS[type];
    const newComparator = comparatorOptions?.[0] ?? ConditionComparator.Is;
    const newCondition: Condition = {
      id: createConditionID(newComparator, type),
      type,
      comparator: newComparator,
      value: undefined,
      openDropdown: comparatorOptions.length > 1 ? FilterChipDropdown.Comparator : FilterChipDropdown.Value,
      isNew: true
    };
    setActiveConditions((currChips) => [...currChips, newCondition]);
  };

  const renderAddConditionChip = () => (
    <>
      <AddConditionChipContainer onClick={() => setShowConditionTypeDropdown(true)} ref={addConditionChipRef}>
        <AddConditionLabel>
          <Typography color='disabled'>Add condition</Typography>
        </AddConditionLabel>
        <AddConditionIcon>
          <Icons color='disabled' icon={Icon.Plus} size={Size.X_SMALL} />
        </AddConditionIcon>
      </AddConditionChipContainer>
      <ConditionTypeDropdown
        activeConditionTypes={activeConditionTypes}
        buttonRef={addConditionChipRef}
        hasFrontendMailFilteringFeatureFlag={hasFrontendMailFilteringFeatureFlag}
        onClickConditionType={addNewCondition}
        setShowDropdown={setShowConditionTypeDropdown}
        showDropdown={showConditionTypeDropdown}
      />
    </>
  );

  const updateCondition = (id: string, updatedCondition: Partial<Condition>) => {
    setActiveConditions((currChips) => {
      // Find and delete condition to update
      const targetChipIndex = currChips.findIndex((chip) => chip.id === id);
      const conditionToUpdate = currChips[targetChipIndex];

      if (!conditionToUpdate) {
        console.error('Updating condition: could not find existing condition.');
        return currChips;
      }

      const newCondition = { ...conditionToUpdate, ...updatedCondition };
      // Remove the old condition and insert the updated condition
      // at the same index as where it was before
      return [
        ...currChips.slice(0, targetChipIndex),
        {
          ...newCondition,
          id: createConditionID(newCondition.comparator, newCondition.type),
          // If the existing condition is already not new, keep isNew as false.
          // Otherwise, only mark the condition as not new once there is a value
          isNew: !conditionToUpdate.isNew ? false : !newCondition.value
        },
        ...currChips.slice(targetChipIndex + 1)
      ];
    });
  };

  // Only show the AND/OR selector if there are more than 2 created (not new) conditions
  // A condition is marked as not new once a type, comparator, and value have all been set once
  const showAndOrConditionOption = activeConditions.filter((condition) => !condition.isNew).length >= 2;
  return (
    <FilterConditionChipsContainer>
      <Chips>
        {activeConditions.map((condition, index) => {
          const { id, type, openDropdown, isNew } = condition;
          return (
            <FilterConditionChip
              condition={condition}
              editChipHelpers={{
                activeConditionTypes,
                contactList: type === ConditionType.From || type === ConditionType.To ? contactList : undefined,
                deleteChip: () => setActiveConditions((currChips) => currChips.filter((chip) => chip.id !== id)),
                updateCondition: (updatedCondition) => updateCondition(id, updatedCondition),
                openDropdown,
                isNew
              }}
              hasFrontendMailFilteringFeatureFlag={hasFrontendMailFilteringFeatureFlag}
              includeConnector={index !== activeConditions.length - 1}
              key={`${id}-${openDropdown ?? ''}`}
              shouldORFilters={shouldORFilters}
            />
          );
        })}
        {canAddNewCondition && renderAddConditionChip()}
      </Chips>
      {/** Only render the AND + OR option if there is more than one condition and all conditions have values set */}
      {showAndOrConditionOption && (
        <AndOrOptionContainer>
          <Typography color='secondary'>Include emails matching</Typography>
          <IconText
            endIcon={Icon.ChevronDown}
            filled
            label={
              shouldORFilters ? FILTER_TYPE_TO_OPTION[FilterType.Or].label : FILTER_TYPE_TO_OPTION[FilterType.And].label
            }
            onClick={() => {
              setShowOrOptionsDropdown((prev) => !prev);
            }}
            ref={orOptionsRef}
            weight={TypographyWeight.REGULAR}
          />
          <Dropdown
            buttonRef={orOptionsRef}
            gapFromAnchor={2}
            portal
            setShowDropdown={setShowOrOptionsDropdown}
            showDropdown={showOrOptionsDropdown}
          >
            <DropdownItem
              active={!shouldORFilters}
              key={FilterType.And}
              label={FILTER_TYPE_TO_OPTION[FilterType.And].label}
              onClick={() => {
                setShouldORFilters(false);
                setShowOrOptionsDropdown(false);
              }}
              value={FilterType.And}
            />
            <DropdownItem
              active={shouldORFilters}
              key={FilterType.Or}
              label={FILTER_TYPE_TO_OPTION[FilterType.Or].label}
              onClick={() => {
                setShouldORFilters(true);
                setShowOrOptionsDropdown(false);
              }}
              value={FilterType.Or}
            />
          </Dropdown>
        </AndOrOptionContainer>
      )}
    </FilterConditionChipsContainer>
  );
};
