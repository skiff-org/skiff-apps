import startCase from 'lodash/startCase';
import toLower from 'lodash/toLower';
import uniq from 'lodash/uniq';
import { Dropdown, DropdownItem } from 'nightwatch-ui';
import pluralize from 'pluralize';
import { Dispatch, MutableRefObject, SetStateAction, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { UserLabelVariant } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../../redux/reducers/modalReducer';
import { ModalType } from '../../../../redux/reducers/modalTypes';
import {
  UserLabelFolder,
  UserLabelPlain,
  isPlainLabel,
  isFolder,
  Label,
  SystemLabel,
  isSystemLabel,
  isNoneLabel
} from '../../../../utils/label';
import { LABEL_DROPDOWN_WIDTH } from '../../../labels/LabelDropdownContent';
import { SelectLabelDropdown } from '../../../labels/SelectLabelDropdown';
import { FRONTEND_CONDITION_TYPES, MarkAsType } from '../Filters.constants';
import { Condition, MoveToType } from '../Filters.types';

import { FilterActionOption } from './FilterActionOption';

const MARK_AS_DROPDOWN_WIDTH = 120;

const ActionOptionsContainer = styled.div`
  display: flex;
  gap: 12px;
  flex-direction: column;
  width: 100%;
`;

const MarkAsDropdownContent = styled.div`
  width: ${MARK_AS_DROPDOWN_WIDTH}px;
  box-sizing: border-box;
  padding: 4px;
`;

interface FilterActionsProps {
  selectedMarkAsOption: MarkAsType;
  setSelectedMoveToOption: Dispatch<SetStateAction<MoveToType | undefined>>;
  setSelectedLabels: Dispatch<SetStateAction<UserLabelPlain[] | undefined>>;
  setSelectedMarkAsOption: Dispatch<SetStateAction<MarkAsType>>;
  shouldSkipNotifications: boolean;
  setShouldSkipNotifications: Dispatch<SetStateAction<boolean>>;
  selectedMoveToOption?: MoveToType;
  selectedLabels?: UserLabelPlain[];
  activeConditions?: Condition[];
  shouldORFilters?: boolean;
  name?: string;
  filterID?: string;
}

export const FilterActions: React.FC<FilterActionsProps> = ({
  selectedMarkAsOption,
  setSelectedMoveToOption,
  setSelectedLabels,
  setSelectedMarkAsOption,
  shouldSkipNotifications,
  setShouldSkipNotifications,
  selectedMoveToOption,
  selectedLabels,
  activeConditions,
  shouldORFilters,
  name,
  filterID
}: FilterActionsProps) => {
  const dispatch = useDispatch();

  const moveToButtonRef = useRef<HTMLDivElement | null>(null);
  const labelButtonRef = useRef<HTMLDivElement | null>(null);
  const markAsButtonRef = useRef<HTMLDivElement | null>(null);

  const [isMoveToDropdownOpen, setIsMoveToDropdownOpen] = useState(false);
  const [isLabelDropdownOpen, setIsLabelDropdownOpen] = useState(false);
  const [isMarkAsDropdownOpen, setIsMarkAsDropdownOpen] = useState(false);

  const isPlainLabelActive = (label: Label) =>
    isPlainLabel(label) && !!selectedLabels?.map((currSelectedLabel) => currSelectedLabel.value).includes(label.value);

  const getLabelsSelectedText = () => {
    if (!selectedLabels?.length) return 'No labels';
    // If there is only one selected label, return the name of the label
    if (selectedLabels.length === 1) return selectedLabels[0]?.name;
    return pluralize('label', selectedLabels.length, true);
  };

  const onSelectLabel = (label: UserLabelPlain) => {
    if (isPlainLabelActive(label)) {
      const newSelectedLabels =
        selectedLabels?.filter((currSelectedLabel) => currSelectedLabel.value !== label.value) ?? [];
      setSelectedLabels(newSelectedLabels);
      return newSelectedLabels;
    } else {
      const newSelectedLabels = uniq([...(selectedLabels ?? []), label]);
      setSelectedLabels(newSelectedLabels);
      return newSelectedLabels;
    }
  };

  const onSelectFolderOrSystemLabel = (folderOrSystemLabel: UserLabelFolder | SystemLabel | undefined) => {
    setSelectedMoveToOption(folderOrSystemLabel);
    setIsMoveToDropdownOpen(false);
  };

  const getRightAlignedDropdownAnchor = (ref: MutableRefObject<HTMLDivElement | null>, dropdownWidth: number) => {
    return ref.current
      ? {
          x: ref.current.getBoundingClientRect().x + ref.current.getBoundingClientRect().width - dropdownWidth,
          y: ref.current.getBoundingClientRect().y + ref.current.getBoundingClientRect().height
        }
      : undefined;
  };

  const containsFEFilteringConditions = activeConditions?.some((condition) =>
    FRONTEND_CONDITION_TYPES.includes(condition.type)
  );

  return (
    <>
      <ActionOptionsContainer>
        <FilterActionOption
          buttonRef={moveToButtonRef}
          label='Move to'
          onClick={() => setIsMoveToDropdownOpen((prev) => !prev)}
          selectedOption={selectedMoveToOption?.name}
        />
        <FilterActionOption
          buttonRef={labelButtonRef}
          label='Apply labels'
          onClick={() => {
            setIsLabelDropdownOpen((prev) => !prev);
          }}
          selectedOption={getLabelsSelectedText()}
        />
        <FilterActionOption
          buttonRef={markAsButtonRef}
          label='Mark as'
          onClick={() => setIsMarkAsDropdownOpen((prev) => !prev)}
          selectedOption={startCase(toLower(selectedMarkAsOption))}
        />
        {/** We can only skip notifications for emails filtered on the backend */}
        {!containsFEFilteringConditions && (
          <FilterActionOption
            isToggle
            label='Skip notifications'
            onClick={() => setShouldSkipNotifications((prev) => !prev)}
            selectedOption={shouldSkipNotifications}
          />
        )}
      </ActionOptionsContainer>
      {/** Labels dropdown */}
      <SelectLabelDropdown
        buttonRef={labelButtonRef}
        isLabelActive={isPlainLabelActive}
        onClose={() => {
          setIsLabelDropdownOpen(false);
        }}
        onCloseCreateLabelOrFolderModal={(userLabel?: UserLabelPlain | UserLabelFolder) => {
          const isUserLabelPlain = userLabel && isPlainLabel(userLabel);
          const updatedLabels: UserLabelPlain[] | undefined = isUserLabelPlain
            ? onSelectLabel(userLabel)
            : selectedLabels;
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.Filter,
              selectedLabels: updatedLabels,
              selectedMoveToOption,
              selectedMarkAsOption,
              shouldSkipNotifications,
              activeConditions,
              shouldORFilters,
              name,
              filterID
            })
          );
        }}
        onDeleteLabel={(deletedLabel) => {
          setSelectedLabels((prevLabels) => prevLabels?.filter((label) => label.value !== deletedLabel.value));
        }}
        onSelectLabel={onSelectLabel}
        open={isLabelDropdownOpen}
        userAnchor={getRightAlignedDropdownAnchor(labelButtonRef, LABEL_DROPDOWN_WIDTH)}
      />
      {/** System label and folder dropdown */}
      <SelectLabelDropdown
        buttonRef={moveToButtonRef}
        includeSystemLabels
        isLabelActive={(label) => {
          if (isNoneLabel(label)) return selectedMoveToOption === undefined;
          return (isFolder(label) || isSystemLabel(label)) && label.value === selectedMoveToOption?.value;
        }}
        onClose={() => setIsMoveToDropdownOpen(false)}
        onCloseCreateLabelOrFolderModal={(userLabel?: UserLabelPlain | UserLabelFolder) => {
          const isUserLabelFolder = userLabel && isFolder(userLabel);
          if (isUserLabelFolder) {
            onSelectFolderOrSystemLabel(userLabel);
          }
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.Filter,
              selectedMoveToOption: isUserLabelFolder ? userLabel : selectedMoveToOption,
              selectedLabels,
              selectedMarkAsOption,
              shouldSkipNotifications,
              activeConditions,
              shouldORFilters,
              name,
              filterID
            })
          );
        }}
        onDeleteLabel={(deletedFolder) => {
          // If the selected move to option is the folder we deleted, clear the move to option
          if (selectedMoveToOption?.value === deletedFolder.value) setSelectedMoveToOption(undefined);
        }}
        onSelectFolderOrSystemLabel={onSelectFolderOrSystemLabel}
        open={isMoveToDropdownOpen}
        userAnchor={getRightAlignedDropdownAnchor(moveToButtonRef, LABEL_DROPDOWN_WIDTH)}
        variant={UserLabelVariant.Folder}
      />
      {/** Mark as read/unread dropdown */}
      <Dropdown
        buttonRef={markAsButtonRef}
        customAnchor={getRightAlignedDropdownAnchor(markAsButtonRef, MARK_AS_DROPDOWN_WIDTH)}
        noPadding
        portal
        setShowDropdown={setIsMarkAsDropdownOpen}
        showDropdown={isMarkAsDropdownOpen}
      >
        <MarkAsDropdownContent>
          {Object.values(MarkAsType).map((type) => (
            <DropdownItem
              active={type === selectedMarkAsOption}
              key={type}
              label={startCase(toLower(type))}
              onClick={() => {
                setSelectedMarkAsOption(type);
                setIsMarkAsDropdownOpen(false);
              }}
              value={type}
            />
          ))}
        </MarkAsDropdownContent>
      </Dropdown>
    </>
  );
};
