import { Dropdown, DropdownItem, Icon } from '@skiff-org/skiff-ui';
import { isString } from 'lodash';
import { useRouter } from 'next/router';
import React, { RefObject } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useDeleteUserLabelMutation } from '../../generated/graphql';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import useCustomSnackbar from '../../hooks/useCustomSnackbar';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { removeUserLabelFromCache } from '../../utils/cache';
import { UserLabel } from '../../utils/label';

const LabelItem = styled.div`
  margin: 4px;
  width: 96%;
`;

interface LabelOptionsDropdownProps {
  label: UserLabel;
  buttonRef: RefObject<HTMLDivElement>;
  setShowDropdown: (value: boolean) => void;
}

const LabelOptionsDropdown: React.FC<LabelOptionsDropdownProps> = ({ label, buttonRef, setShowDropdown }) => {
  const routeLabel = useCurrentLabel();
  const router = useRouter();
  const { enqueueCustomSnackbar } = useCustomSnackbar();

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

  const dispatch = useDispatch();

  const openEditModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(
      skemailModalReducer.actions.setOpenModal({
        type: ModalType.CreateOrEditUserLabel,
        label: label
      })
    );
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
        await router.push('/inbox');
      }
    } catch (e) {
      console.error(e);
      enqueueCustomSnackbar({
        body: 'Failed to delete label'
      });
    }
  };

  return (
    <Dropdown buttonRef={buttonRef} className='labelItemDropdown' setShowDropdown={setShowDropdown}>
      <LabelItem>
        <DropdownItem icon={Icon.Edit} label='Edit label' onClick={openEditModal} />
        <DropdownItem icon={Icon.Trash} label='Trash' onClick={deleteLabelHandler} />
      </LabelItem>
    </Dropdown>
  );
};

export default LabelOptionsDropdown;
