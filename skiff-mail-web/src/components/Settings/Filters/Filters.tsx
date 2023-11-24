import { Button, Type, Typography, TypographySize, TypographyWeight } from 'nightwatch-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useGetMailFiltersQuery } from 'skiff-front-graphql';
import {
  contactToAddressObject,
  DEFAULT_WORKSPACE_EVENT_VERSION,
  TitleActionSection,
  useGetAllContactsWithOrgMembers
} from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import { filterExists } from 'skiff-utils';
import styled from 'styled-components';

import { useAppSelector } from '../../../hooks/redux/useAppSelector';
import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

import { FilterModal } from './FilterModal';
import { filterFromGraphQL } from './Filters.utils';
import { FiltersTable } from './FiltersTable';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  height: 100%;
`;

const TitleRow = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`;

const HeaderContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 6px; // the is to maintain the same spacing between the title and subtitle on the other settings tabs
`;

export const Filters: React.FC = () => {
  const { openModal } = useAppSelector((state) => state.modal);
  const dispatch = useDispatch();

  const isFilterModalOpen = openModal?.type === ModalType.Filter;

  const {
    filterID,
    activeConditions: defaultConditions,
    selectedMoveToOption: defaultSelectedMoveToOption,
    selectedLabels: defaultSelectedLabels,
    selectedMarkAsOption: defaultSelectedMarkAsOption,
    shouldSkipNotifications: defaultShouldSkipNotifications,
    shouldORFilters: defaultShouldORFilters,
    name: defaultName
  } = isFilterModalOpen
    ? openModal
    : {
        filterID: undefined,
        activeConditions: undefined,
        selectedMoveToOption: undefined,
        selectedLabels: undefined,
        selectedMarkAsOption: undefined,
        shouldSkipNotifications: undefined,
        shouldORFilters: undefined,
        name: undefined
      };

  const { contactsWithOrgMembers, loading: contactsLoading } = useGetAllContactsWithOrgMembers();
  const contacts = contactsWithOrgMembers.map(contactToAddressObject);

  const { data, loading: filtersLoading, refetch } = useGetMailFiltersQuery();
  const filters = data?.mailFilters.map((filter) => filterFromGraphQL(filter, contacts)).filter(filterExists);

  const openNewFilterModal = () => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Filter }));
    void storeWorkspaceEvent(WorkspaceEventType.CreateMailFilterClicked, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const isLoading = filtersLoading || contactsLoading;
  return (
    <>
      <Container>
        <HeaderContainer>
          <TitleRow>
            <Typography size={TypographySize.H4} weight={TypographyWeight.BOLD}>
              Filters
            </Typography>
            {!isMobile && filters?.length !== 0 && !isLoading && (
              <Button onClick={openNewFilterModal} type={Type.SECONDARY}>
                New filter
              </Button>
            )}
          </TitleRow>
          {!isLoading && filters?.length !== 0 && (
            <TitleActionSection subtitle='Custom filters that are applied to all incoming mail' />
          )}
        </HeaderContainer>
        <FiltersTable filters={filters ?? []} isFiltersLoading={isLoading} />
      </Container>
      {isFilterModalOpen && (
        <FilterModal
          defaultConditions={defaultConditions}
          defaultName={defaultName}
          defaultSelectedLabels={defaultSelectedLabels}
          defaultSelectedMarkAsOption={defaultSelectedMarkAsOption}
          defaultSelectedMoveToOption={defaultSelectedMoveToOption}
          defaultShouldORFilters={defaultShouldORFilters}
          defaultShouldSkipNotifications={defaultShouldSkipNotifications}
          filterID={filterID}
          refetchFilters={refetch}
        />
      )}
    </>
  );
};
