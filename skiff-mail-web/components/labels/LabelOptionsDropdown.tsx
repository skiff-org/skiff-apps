import { isString } from 'lodash';
import { ButtonGroupItem, Dialog, DialogTypes, Dropdown, DropdownItem, Icon } from 'nightwatch-ui';
import React, { RefObject, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useToast } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import { useDeleteUserLabelMutation } from 'skiff-mail-graphql';

import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { removeUserLabelFromCache } from '../../utils/cache/cache';
import { UserLabel, UserLabelFolder } from '../../utils/label';
import { useNavigate } from '../../utils/navigation';

interface LabelOptionsDropdownProps {
  label: UserLabel | UserLabelFolder;
  buttonRef: RefObject<HTMLDivElement>;
  showDropdown: boolean;
  setShowDropdown: (value: boolean) => void;
  isSubMenu?: boolean;
}

const LabelOptionsDropdown: React.FC<LabelOptionsDropdownProps> = ({
  label,
  buttonRef,
  showDropdown,
  setShowDropdown,
  isSubMenu
}) => {
  const { navigateToInbox } = useNavigate();
  const dispatch = useDispatch();
  const routeLabel = useCurrentLabel();
  const { enqueueToast } = useToast();

  const [deleteLabel] = useDeleteUserLabelMutation();

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
    } catch (e) {
      console.error(e);
      enqueueToast({
        body: `Failed to delete ${label.variant === UserLabelVariant.Folder ? 'folder' : 'label'}`,
        icon: Icon.Warning
      });
    }
  };

  const openEditModal = () => {
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.CreateOrEditLabelOrFolder,
        label,
        folder: label.variant === UserLabelVariant.Folder
      })
    );
  };

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const openConfirmDialog = () => setIsConfirmOpen(true);
  const closeConfirmDialog = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsConfirmOpen(false);
  };
  const closeDropdown = () => setShowDropdown(false);

  return (
    <>
      <Dropdown
        buttonRef={buttonRef}
        className='labelItemDropdown'
        isSubMenu={isSubMenu}
        portal
        setShowDropdown={setShowDropdown}
        showDropdown={showDropdown}
      >
        <DropdownItem
          icon={Icon.Edit}
          label={`Edit ${label.variant === UserLabelVariant.Folder ? 'folder' : 'label'}`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            openEditModal();
            closeDropdown();
          }}
        />
        <DropdownItem
          icon={Icon.Trash}
          label='Trash'
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
            deleteLabelHandler();
            closeConfirmDialog(e);
          }}
        />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={closeConfirmDialog} />
      </Dialog>
    </>
  );
};

export default LabelOptionsDropdown;
