import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogTypes,
  Icon,
  IconProps,
  Icons,
  InputField,
  TEXT_COLORS,
  Typography
} from '@skiff-org/skiff-ui';
import { GraphQLError } from 'graphql';
import { isString } from 'lodash';
import { useRouter } from 'next/router';
import React, { Fragment, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { useApplyLabelsMutation, useCreateUserLabelMutation, useEditUserLabelMutation } from '../../generated/graphql';
import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { ModalType } from '../../redux/reducers/modalTypes';
import { AppDispatch } from '../../redux/store/reduxStore';
import { updateThreadsWithModifiedLabels, updateUserLabelsOnCreateOrEdit } from '../../utils/cache';
import { assertExists } from '../../utils/typeUtils';

const LabelInput = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ColorList = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const ColorOption = styled.div`
  padding: 4px;
  border-radius: 20px;
  &:hover {
    background: var(--bg-cell-hover);
    cursor: pointer;
  }
`;

const ColorCircle = styled.div<{ color: string }>`
  height: 20px;
  width: 20px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  background: ${(props) => props.color};
`;

const ColorIcon = styled(Icons)`
  transform: scale(1.7);
  width: 24px !important;
  height: 24px !important;
  place-self: center;
  margin: 0 !important;
`;

export const CreateOrEditUserLabelModal = () => {
  const routeLabel = useCurrentLabel();
  const router = useRouter();
  const [createLabel] = useCreateUserLabelMutation();
  const [editLabel] = useEditUserLabelMutation();
  const [applyLabel] = useApplyLabelsMutation();

  const { openModal } = useAppSelector((state) => state.modal);

  const existingLabel = openModal?.type === ModalType.CreateOrEditUserLabel ? openModal.label : undefined;

  // Threads that a newly created label will be applied to
  const threadIDs = openModal?.type === ModalType.CreateOrEditUserLabel ? openModal.threadIDs : undefined;

  // If the modal type is Edit, this will be populated with the label being edited
  // if it's a Create modal, this will be empty
  const [labelName, setLabelName] = useState(existingLabel?.name ?? '');
  const [color, setColor] = useState(existingLabel?.color ?? '');

  const dispatch = useDispatch<AppDispatch>();
  const isReadyToSubmit = color && labelName;
  const [errors, setErrors] = useState<readonly GraphQLError[]>([]);

  const onClose = () => {
    setLabelName('');
    setColor('');
    setErrors([]);
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const createUserLabel = async () => {
    const { data } = await createLabel({
      variables: { request: { color, labelName } },
      onError: (error) => setErrors(error.graphQLErrors),
      update: (cache, response) => {
        updateUserLabelsOnCreateOrEdit(cache, response?.data?.createUserLabel, response?.errors);
      }
    });
    assertExists(data?.createUserLabel?.labelID);
    if (threadIDs) {
      await applyLabel({
        variables: { request: { threadIDs, userLabels: [data.createUserLabel.labelID] } },
        update: (cache, response) => {
          updateThreadsWithModifiedLabels({
            cache,
            updatedThreads: response.data?.applyLabels?.updatedThreads,
            errors: response.errors
          });
          dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [] }));
        }
      });
    }
  };

  const editUserLabel = async () => {
    if (!existingLabel) {
      console.error('Failed to edit, no existing label found');
      return;
    }
    await editLabel({
      variables: { request: { labelID: existingLabel?.value, labelName, color } },
      onError: (error) => setErrors(error.graphQLErrors),
      update: (cache, response) => {
        updateUserLabelsOnCreateOrEdit(cache, response?.data?.editUserLabel, response?.errors);
      }
    });
    // If the user is currently at the inbox of the modified label, redirect to its new URL
    if (!errors.length) {
      const encodedExistingLabelName = encodeURIComponent(existingLabel.name.toLowerCase());
      const isLabelToModifyActive =
        isString(routeLabel) && encodeURIComponent(routeLabel.toLowerCase()) === encodedExistingLabelName;
      if (isLabelToModifyActive) {
        const newLabelURL = encodeURIComponent(labelName.toLowerCase());
        await router.push(`/label#${newLabelURL}`);
      }
    }
  };

  const onCreateOrEdit = async () => {
    if (isReadyToSubmit) {
      if (!existingLabel) {
        await createUserLabel();
      } else {
        await editUserLabel();
      }
      if (!errors.length) {
        onClose();
      }
    }
  };

  return (
    <Dialog
      customContent
      onClose={onClose}
      open={openModal?.type === ModalType.CreateOrEditUserLabel}
      title={!!existingLabel ? 'Edit Label' : 'Create Label'}
      type={DialogTypes.Input}
    >
      <LabelInput>
        <InputField
          autoFocus
          onChange={(e) => setLabelName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              void onCreateOrEdit();
            }
          }}
          placeholder='Label name'
          size='small'
          value={labelName}
        />
      </LabelInput>
      <ColorList>
        {Object.entries(TEXT_COLORS).map(([colorName, colorValue]) => (
          <Fragment key={colorValue}>
            {colorName !== color && (
              <ColorOption
                key={colorName}
                onClick={(evt: React.MouseEvent) => {
                  evt.stopPropagation();
                  setColor(colorName);
                }}
              >
                <ColorCircle color={colorValue} />
              </ColorOption>
            )}
            {colorName === color && <ColorIcon color={colorName as IconProps['color']} icon={Icon.RadioFilled} />}
          </Fragment>
        ))}
      </ColorList>
      {errors.length > 0 && <Typography color='destructive'>{errors.map((e) => e.message).join('. ')}</Typography>}
      <ButtonGroup>
        <ButtonGroupItem
          disabled={!isReadyToSubmit}
          key='submit'
          label={!!existingLabel ? 'Save' : 'Create'}
          onClick={onCreateOrEdit}
        />
        <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
      </ButtonGroup>
    </Dialog>
  );
};
