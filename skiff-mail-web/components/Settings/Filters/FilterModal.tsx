import { ApolloError, ApolloQueryResult } from '@apollo/client';
import {
  Button,
  ButtonGroup,
  ButtonGroupItem,
  Dialog,
  Divider,
  InputField,
  Type,
  Typography,
  TypographySize
} from 'nightwatch-ui';
import { ChangeEvent, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  GetMailFiltersQuery,
  useCreateMailFilterMutation,
  useDeleteMailFilterMutation,
  useUpdateMailFilterMutation
} from 'skiff-front-graphql';
import { ConfirmModal } from 'skiff-front-utils';
import { getPaywallErrorCode } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { UserLabelPlain } from '../../../utils/label';

import { FilterActions } from './FilterActions/FilterActions';
import { FilterConditionChips } from './FilterConditionChips';
import { MarkAsType } from './Filters.constants';
import { Condition, MoveToType } from './Filters.types';
import { createCreateMailFilterInput } from './Filters.utils';

const FilterDetailsContainer = styled.div`
  display: flex;
  gap: 20px;
  flex-direction: column;
  width: 100%;
`;

const ButtonRow = styled.div<{ $flexEnd: boolean }>`
  display: flex;
  justify-content: ${({ $flexEnd }) => ($flexEnd ? 'flex-end' : 'space-between')};
  width: 100%;
  padding-top: 4px;
`;

interface FilterModalProps {
  refetchFilters: () => Promise<ApolloQueryResult<GetMailFiltersQuery>>;
  defaultConditions?: Condition[];
  defaultSelectedMoveToOption?: MoveToType;
  defaultSelectedLabels?: UserLabelPlain[];
  defaultSelectedMarkAsOption?: MarkAsType;
  defaultShouldORFilters?: boolean;
  defaultName?: string;
  filterID?: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  refetchFilters,
  defaultConditions,
  defaultSelectedMoveToOption,
  defaultSelectedLabels,
  defaultSelectedMarkAsOption,
  defaultShouldORFilters,
  defaultName,
  filterID
}: FilterModalProps) => {
  const dispatch = useDispatch();

  const nameInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(defaultName);
  const [activeConditions, setActiveConditions] = useState<Condition[]>(defaultConditions ?? []);
  const [shouldORFilters, setShouldORFilters] = useState(defaultShouldORFilters ?? false);
  const [selectedMarkAsOption, setSelectedMarkAsOption] = useState(defaultSelectedMarkAsOption ?? MarkAsType.Unread);
  // You can either move an email to a folder or system label
  const [selectedMoveToOption, setSelectedMoveToOption] = useState<MoveToType | undefined>(defaultSelectedMoveToOption);
  const [selectedLabels, setSelectedLabels] = useState<UserLabelPlain[] | undefined>(defaultSelectedLabels);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const [createMailFilterMutation, { loading: isCreateFilterLoading }] = useCreateMailFilterMutation();
  const [deleteMailFilterMutation, { loading: isDeleteFilterLoading }] = useDeleteMailFilterMutation();
  const [updateMailFilterMutation, { loading: isUpdateFilterLoading }] = useUpdateMailFilterMutation();

  // If filterID is undefined, this means we are creating a new filter.
  // If it is defined, we are editing an existing filter.
  const isCreatingNewFilter = !filterID;

  const closeModal = () => {
    dispatch(skemailModalReducer.actions.setOpenModal(undefined));
  };

  const createOrUpdateFilter = async () => {
    try {
      const newMailFilter = createCreateMailFilterInput(
        activeConditions,
        shouldORFilters,
        selectedMoveToOption,
        selectedLabels,
        selectedMarkAsOption === MarkAsType.Read,
        name?.trim() ?? undefined
      );
      const noFilterToUpdate = !isCreatingNewFilter && !filterID;
      if (!newMailFilter || noFilterToUpdate) {
        const errorMsg = noFilterToUpdate
          ? 'Could not update filter.'
          : `Filter not ${isCreatingNewFilter ? 'saved' : 'updated'}. Define at least one condition and action.`;
        console.error(errorMsg);
        setError(errorMsg);
        return;
      }
      if (isCreatingNewFilter) {
        await createMailFilterMutation({
          variables: {
            request: newMailFilter
          }
        });
      } else {
        await updateMailFilterMutation({
          variables: {
            request: {
              ...newMailFilter,
              mailFilterID: filterID
            }
          }
        });
      }

      // Clear error message after success
      setError('');
      await refetchFilters();
      closeModal();
    } catch (e) {
      if (e instanceof ApolloError) {
        const paywallErrorCode = getPaywallErrorCode(e.graphQLErrors);
        if (paywallErrorCode) {
          dispatch(
            skemailModalReducer.actions.setOpenModal({
              type: ModalType.Paywall,
              paywallErrorCode: paywallErrorCode,
              onClose: closeModal
            })
          );
          return;
        }
      }
      console.error(e);
      setError('Could not save filter.');
    }
  };

  const deleteFilter = async () => {
    try {
      if (!filterID) throw new Error('Could not delete filter: no ID given.');
      await deleteMailFilterMutation({
        variables: {
          request: {
            mailFilterID: filterID
          }
        }
      });
      // Clear error message after success
      setError('');
      await refetchFilters();
    } catch (e) {
      console.error(e);
      setError('Could not delete filter.');
    }

    closeModal();
  };

  const onInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && nameInputRef.current) {
      e.preventDefault();
      nameInputRef.current.blur();
    }
  };

  const title = isCreatingNewFilter ? 'Create new filter' : 'Edit filter';
  const description = 'Name your filter and define it with conditions and actions';

  return (
    <>
      <Dialog customContent description={description} hideCloseButton onClose={closeModal} open title={title}>
        <FilterDetailsContainer>
          <InputField
            innerRef={nameInputRef}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            onKeyPress={onInputEnter}
            placeholder='Filter name'
            value={name}
          />
          <FilterConditionChips
            activeConditions={activeConditions}
            setActiveConditions={setActiveConditions}
            setShouldORFilters={setShouldORFilters}
            shouldORFilters={shouldORFilters}
          />
          <Divider color='secondary' />
          <FilterActions
            activeConditions={activeConditions}
            filterID={filterID}
            name={name}
            selectedLabels={selectedLabels}
            selectedMarkAsOption={selectedMarkAsOption}
            selectedMoveToOption={selectedMoveToOption}
            setSelectedLabels={setSelectedLabels}
            setSelectedMarkAsOption={setSelectedMarkAsOption}
            setSelectedMoveToOption={setSelectedMoveToOption}
            shouldORFilters={shouldORFilters}
          />
        </FilterDetailsContainer>
        {error && (
          <Typography color='destructive' size={TypographySize.SMALL}>
            {error}
          </Typography>
        )}
        <ButtonRow $flexEnd={isCreatingNewFilter}>
          {!isCreatingNewFilter && (
            <Button loading={isDeleteFilterLoading} onClick={() => setShowConfirmDelete(true)} type={Type.DESTRUCTIVE}>
              Delete
            </Button>
          )}
          <ButtonGroup>
            <ButtonGroupItem
              key='save'
              label={isCreatingNewFilter ? 'Create' : 'Save'}
              loading={isCreateFilterLoading || isUpdateFilterLoading}
              onClick={createOrUpdateFilter}
            />
            <ButtonGroupItem
              disabled={isCreateFilterLoading || isUpdateFilterLoading}
              key='cancel'
              label='Cancel'
              onClick={closeModal}
            />
          </ButtonGroup>
        </ButtonRow>
      </Dialog>
      <ConfirmModal
        confirmName='Delete'
        description='All incoming mail that matches the conditions will no longer be filtered.'
        destructive
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={deleteFilter}
        open={showConfirmDelete}
        title='Delete filter?'
      />
    </>
  );
};
