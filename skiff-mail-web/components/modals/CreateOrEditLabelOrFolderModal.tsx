import { ApolloError } from '@apollo/client';
import { GraphQLError } from 'graphql';
import { isString } from 'lodash';
import { useRouter } from 'next/router';
import {
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  DialogTypes,
  InputField,
  Typography,
  accentColorToPrimaryColor
} from 'nightwatch-ui';
import React, { useState, useRef, useEffect } from 'react';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { ColorSelector } from 'skiff-front-utils';
import { UserLabelVariant } from 'skiff-graphql';
import {
  useApplyLabelsMutation,
  useCreateUserLabelMutation,
  useDeleteUserLabelMutation,
  useEditUserLabelMutation
} from 'skiff-mail-graphql';
import { PaywallErrorCode, isPaywallErrorCode } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../hooks/redux/useAppSelector';
import { useCurrentLabel } from '../../hooks/useCurrentLabel';
import { skemailMailboxReducer } from '../../redux/reducers/mailboxReducer';
import { skemailMobileDrawerReducer } from '../../redux/reducers/mobileDrawerReducer';
import { skemailModalReducer } from '../../redux/reducers/modalReducer';
import { isCreateOrEditLabelOrFolderModal, ModalType } from '../../redux/reducers/modalTypes';
import { AppDispatch } from '../../redux/store/reduxStore';
import {
  removeUserLabelFromCache,
  updateThreadsWithModifiedLabels,
  updateUserLabelsOnCreateOrEdit
} from '../../utils/cache/cache';

const LabelInput = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const CreateOrEditLabelOrFolderModal = () => {
  const routeLabel = useCurrentLabel();
  const router = useRouter();
  const [createLabel] = useCreateUserLabelMutation();
  const [editLabel] = useEditUserLabelMutation();
  const [applyLabel] = useApplyLabelsMutation();
  const [deleteLabel] = useDeleteUserLabelMutation();

  const { openModal } = useAppSelector((state) => state.modal);

  // Threads that a newly created label will be applied to
  const {
    label: existingLabel,
    threadIDs,
    folder: folderModal,
    initialName
  } = isCreateOrEditLabelOrFolderModal(openModal)
    ? openModal
    : { label: undefined, threadIDs: undefined, folder: false, initialName: '' };

  // If the modal type is Edit, this will be populated with the label being edited
  // if it's a Create modal, this will be empty
  const [labelName, setLabelName] = useState(existingLabel?.name ?? initialName ?? '');
  const [color, setColor] = useState<string>(existingLabel?.color ?? 'red');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const isReadyToSubmit = color && labelName;
  const [errors, setErrors] = useState<readonly GraphQLError[]>([]);
  const [paywallErrorCode, setPaywallErrorCode] = useState<PaywallErrorCode | null>(null);

  const onClose = () => {
    setLabelName('');
    setColor('red');
    setErrors([]);
    setPaywallErrorCode(null);
    setLoading(false);
    if (paywallErrorCode) {
      dispatch(
        skemailModalReducer.actions.setOpenModal({
          type: ModalType.Paywall,
          paywallErrorCode: paywallErrorCode
        })
      );
    } else {
      dispatch(skemailModalReducer.actions.setOpenModal(undefined));
      // If on mobile open the label drawer again
      if (isMobile) {
        dispatch(skemailMobileDrawerReducer.actions.setShowApplyLabelDrawer(UserLabelVariant.Plain));
      }
    }
  };

  // onClose intentionally run after preceding render and state updates complete
  // due to different handling for paywall and non-paywall errors
  useEffect(() => {
    if (paywallErrorCode) {
      onClose();
    }
  });

  const handleErrors = (error: ApolloError) => {
    const code = error.graphQLErrors[0]?.extensions?.code as PaywallErrorCode;
    if (isPaywallErrorCode(code)) {
      setPaywallErrorCode(code);
    } else {
      setErrors(error.graphQLErrors);
    }
  };

  const createUserLabel = async () => {
    const { data } = await createLabel({
      variables: {
        request: { color, labelName, variant: folderModal ? UserLabelVariant.Folder : UserLabelVariant.Plain }
      },
      onError: (error) => handleErrors(error),
      update: (cache, response) => {
        updateUserLabelsOnCreateOrEdit(cache, response?.data?.createUserLabel, response?.errors);
      }
    });
    return data;
  };

  const applyUserLabel = async (labelID: string) => {
    // If not on mobile add the newly created label to selected threads and reset selected threads
    if (!threadIDs || isMobile) return;
    await applyLabel({
      variables: { request: { threadIDs, userLabels: [labelID] } },
      update: (cache, response) => {
        void updateThreadsWithModifiedLabels({
          cache,
          updatedThreads: response.data?.applyLabels?.updatedThreads,
          errors: response.errors
        });
        dispatch(skemailMailboxReducer.actions.setSelectedThreadIDs({ selectedThreadIDs: [] }));
      }
    });
  };

  const editUserLabel = async () => {
    if (!existingLabel) {
      console.error(`Failed to edit, no existing ${folderModal ? 'folder' : 'label'} found`);
      return;
    }
    const { data } = await editLabel({
      variables: { request: { labelID: existingLabel?.value, labelName, color } },
      onError: (error) => setErrors(error.graphQLErrors),
      update: (cache, response) => {
        updateUserLabelsOnCreateOrEdit(cache, response?.data?.editUserLabel, response?.errors);
      }
    });
    return data;
  };

  const routeToEditedLabel = async () => {
    // If the user is currently at the inbox of the modified label, redirect to its new URL
    if (existingLabel) {
      const encodedExistingLabelName = encodeURIComponent(existingLabel.name.toLowerCase());
      const isLabelToModifyActive =
        isString(routeLabel) && encodeURIComponent(routeLabel.toLowerCase()) === encodedExistingLabelName;
      if (isLabelToModifyActive) {
        const newLabelURL = encodeURIComponent(labelName.toLowerCase());
        await router.push(`/label#${newLabelURL}`);
      }
    }
  };

  const deleteUserLabel = async () => {
    if (!existingLabel) {
      console.error(`Failed to delete, no existing ${folderModal ? 'folder' : 'label'} found`);
      return;
    }
    await deleteLabel({
      variables: {
        request: {
          labelID: existingLabel?.value
        }
      },
      update: (cache) => {
        removeUserLabelFromCache(cache, existingLabel?.value);
      }
    });
  };

  const onCreate = async () => {
    if (!labelName) return;
    setLoading(true);
    const data = await createUserLabel();
    if (!!data?.createUserLabel?.labelID) {
      // request succeeded
      await applyUserLabel(data.createUserLabel.labelID);
      onClose();
    } else {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    if (!labelName) return;
    setLoading(true);
    const data = await editUserLabel();
    if (!!data?.editUserLabel?.labelID) {
      // request succeeded
      onClose(); // handle onClose first to avoid setting state on an unmounted component after a possible reroute
      await routeToEditedLabel();
    } else {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (isReadyToSubmit) {
      await deleteUserLabel();
      if (!errors.length) {
        onClose();
      }
    }
  };

  const handleChange = (value: string) => {
    // reset errors in case user starts trying again after a non-onClose-triggering error (e.g. a duplicate name)
    if (!!errors.length) setErrors([]);
    setLabelName(value);
  };

  const submit = () => {
    if (!!existingLabel) {
      void onEdit();
    } else {
      void onCreate();
    }
  };

  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <Dialog
      customContent
      onClose={onClose}
      open={openModal?.type === ModalType.CreateOrEditLabelOrFolder}
      title={`${!!existingLabel ? 'Edit' : 'Create'} ${folderModal ? 'folder' : 'label'}`}
      type={DialogTypes.Input}
    >
      <LabelInput>
        <InputField
          autoFocus
          innerRef={inputRef}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange(e.target.value)}
          onKeyPress={(e) => {
            if (isReadyToSubmit && !loading && e.key === 'Enter') {
              submit();
            }
          }}
          placeholder={`${folderModal ? 'Folder' : 'Label'} name`}
          size='small'
          value={labelName}
        />
      </LabelInput>
      <ColorSelector
        colorToStyling={accentColorToPrimaryColor}
        handleChange={(profileAccentColor) => {
          setColor(profileAccentColor);
          // Focus to allow us to keep editing label name + press enter
          inputRef.current?.focus();
        }}
        value={color}
      />
      {!!errors.length && <Typography color='destructive'>{errors.map((e) => e.message).join('. ')}</Typography>}
      {/* When on mobile and editing a label, also show delete button*/}
      {isMobile && (
        <ButtonGroup>
          <ButtonGroupItem key='submit' label={!!existingLabel ? 'Save' : 'Create'} onClick={submit} />
          <ButtonGroupItem destructive key='delete' label='Delete' onClick={() => void onDelete()} />
          <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
        </ButtonGroup>
      )}
      {!isMobile && (
        <ButtonGroup>
          <ButtonGroupItem key='submit' label={!!existingLabel ? 'Save' : 'Create'} onClick={submit} />
          <ButtonGroupItem key='cancel' label='Cancel' onClick={onClose} />
        </ButtonGroup>
      )}
    </Dialog>
  );
};
