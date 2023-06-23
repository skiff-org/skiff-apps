import isString from 'lodash/isString';
import {
  BackgroundBlocker,
  ButtonGroupItem,
  CustomCircularProgress,
  Dialog,
  DialogTypes,
  Dropdown,
  DropdownItem,
  Icon,
  InputField,
  Size,
  ThemeMode,
  accentColorToPrimaryColor,
  themeNames
} from '@skiff-org/skiff-ui';
import React, { RefObject, useRef, useState } from 'react';
import { useDeleteUserLabelMutation, useEditUserLabelMutation } from 'skiff-front-graphql';
import { useToast } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { upperCaseFirstLetter } from 'skiff-utils';
import styled from 'styled-components';

import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { removeUserLabelFromCache, updateUserLabelsOnCreateOrEdit } from '../../utils/cache/cache';
import { UserLabelFolder, UserLabelPlain } from '../../utils/label';
import { useNavigate } from '../../utils/navigation';

interface LabelOptionsDropdownProps {
  label: UserLabelPlain | UserLabelFolder;
  buttonRef: RefObject<HTMLDivElement>;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  isSubmenu?: boolean;
  onDeleteLabel?: (label: UserLabelPlain | UserLabelFolder) => void;
}

const InputFieldContainer = styled.div`
  width: 100%;
  margin-bottom: 2px;
`;

const ColorSquare = styled.div<{ color: string }>`
  width: 16px;
  height: 16px;

  background: ${(props) => themeNames.dark[props.color]};
  border: 1px solid ${themeNames.dark['--border-primary']};

  border-radius: 4px;
`;

const LabelOptionsDropdown: React.FC<LabelOptionsDropdownProps> = ({
  label,
  buttonRef,
  showDropdown,
  setShowDropdown,
  isSubmenu,
  onDeleteLabel
}) => {
  const { navigateToInbox } = useNavigate();
  const { label: routeLabel } = useCurrentLabel();
  const [labelName, setLabelName] = useState(label.name);
  const { enqueueToast } = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editLabel, { loading }] = useEditUserLabelMutation();
  const [deleteLabel] = useDeleteUserLabelMutation();

  const closeDropdown = () => {
    setShowDropdown(false);
  };

  const deleteUserLabel = async (labelID: string) => {
    await deleteLabel({
      variables: {
        request: {
          labelID
        }
      },
      update: (cache) => {
        removeUserLabelFromCache(cache, labelID);
      }
    });
  };

  const deleteLabelHandler = async () => {
    try {
      await deleteUserLabel(label.value);
      setShowDropdown(false);
      // If currently routed to the deleted label, redirect to inbox
      const encodedLabelName = encodeURIComponent(label.name.toLowerCase());
      const isLabelToDeleteActive =
        isString(routeLabel) && encodeURIComponent(routeLabel.toLowerCase()) === encodedLabelName;
      if (isLabelToDeleteActive) {
        await navigateToInbox();
      }
      if (onDeleteLabel) onDeleteLabel(label);
    } catch (e) {
      console.error(e);
      enqueueToast({
        title: 'Delete failed',
        body: `Failed to delete ${label.variant === UserLabelVariant.Folder ? 'folder' : 'label'}`
      });
    }
  };

  const editUserLabel = async (color?: string) => {
    const { data } = await editLabel({
      variables: {
        request: {
          labelID: label?.value,
          labelName,
          color,
          variant: label.variant === UserLabelVariant.Folder ? UserLabelVariant.Folder : UserLabelVariant.Plain
        }
      },
      update: (cache, response) => {
        updateUserLabelsOnCreateOrEdit(cache, response?.data?.editUserLabel, response?.errors);
      }
    });
    return data;
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const openConfirmDialog = () => setIsConfirmOpen(true);
  const closeConfirmDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsConfirmOpen(false);
  };

  return (
    <>
      {showDropdown && <BackgroundBlocker onClick={() => setShowDropdown(false)} />}
      <Dropdown
        buttonRef={buttonRef}
        isSubmenu={isSubmenu}
        portal
        ref={dropdownRef}
        setShowDropdown={setShowDropdown}
        showDropdown={showDropdown}
        width={280}
      >
        <InputFieldContainer>
          <InputField
            autoFocus
            borderRadius={6}
            endAdornment={
              loading ? <CustomCircularProgress forceTheme={ThemeMode.DARK} size={Size.SMALL} spinner /> : undefined
            }
            forceTheme={ThemeMode.DARK}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelName(e.target.value)}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onKeyPress={(e) => {
              e?.stopPropagation();
              if (e.key === 'Enter') {
                void editUserLabel();
                setShowDropdown(false);
              }
            }}
            placeholder={label.variant === UserLabelVariant.Folder ? 'Folder' : 'Label'}
            value={labelName}
          />
        </InputFieldContainer>
        {Object.entries(accentColorToPrimaryColor).map(([colorValue, colorStyling]) => {
          const colorName = upperCaseFirstLetter(colorValue.replace(/-/g, ' '));
          const color = colorStyling.replace('var(', '');
          const colorNameNoVar = color.replace(')', '');
          const isActive = colorValue === label?.color;
          return (
            <DropdownItem
              active={isActive}
              key={colorValue}
              label={colorName}
              onClick={async (e: React.MouseEvent) => {
                e.stopPropagation();
                await editUserLabel(colorValue);
                setShowDropdown(false);
              }}
              startElement={<ColorSquare color={colorNameNoVar} />}
            />
          );
        })}
        <DropdownItem
          color='destructive'
          icon={Icon.Trash}
          label='Delete'
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            openConfirmDialog();
            closeDropdown();
          }}
        />
      </Dropdown>
      <Dialog
        description={`The ${label.name} label will be permanently deleted.`}
        onClose={closeConfirmDialog}
        open={isConfirmOpen}
        title={`Delete ${label.name}?`}
        type={DialogTypes.Confirm}
      >
        <ButtonGroupItem
          destructive
          key='delete'
          label='Delete'
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            void deleteLabelHandler();
            closeConfirmDialog(e);
          }}
        />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={closeConfirmDialog} />
      </Dialog>
    </>
  );
};

export default LabelOptionsDropdown;
