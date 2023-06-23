import { Alignment, Button, CustomCircularProgress, Type, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import { isMobile } from 'react-device-detect';
import { useDispatch } from 'react-redux';
import { useUserLabelsQuery } from 'skiff-front-graphql';
import { DEFAULT_WORKSPACE_EVENT_VERSION } from 'skiff-front-utils';
import { WorkspaceEventType } from 'skiff-graphql';
import styled from 'styled-components';

import { skemailModalReducer } from '../../../redux/reducers/modalReducer';
import { ModalType } from '../../../redux/reducers/modalTypes';
import Illustration, { Illustrations } from '../../../svgs/Illustration';
import { sortByName, splitUserLabelsByVariant, userLabelFromGraphQL } from '../../../utils/label';
import { storeWorkspaceEvent } from '../../../utils/userUtils';

import { FilterRow } from './FilterRow';
import { Filter } from './Filters.types';

interface FiltersTableProps {
  filters: Filter[];
  isFiltersLoading: boolean;
}

const LoadingContainer = styled.div`
  padding: 8px;
  display: flex;
  justify-content: center;
`;

const EmptyContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;

  // account for the title height + gap since we want to vertically center this to the entire modal
  height: calc(100% - 68px);
`;

const EmptyFilterText = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const FiltersTableContainer = styled.div`
  height: 100%;
`;

export const FiltersTable: React.FC<FiltersTableProps> = ({ filters, isFiltersLoading }: FiltersTableProps) => {
  const { data, loading: labelsLoading } = useUserLabelsQuery();
  const dispatch = useDispatch();
  const { labels, folders } = splitUserLabelsByVariant(
    data?.userLabels?.map(userLabelFromGraphQL).sort(sortByName) ?? []
  );

  const openNewFilterModal = () => {
    dispatch(skemailModalReducer.actions.setOpenModal({ type: ModalType.Filter }));
    void storeWorkspaceEvent(WorkspaceEventType.CreateMailFilterClicked, '', DEFAULT_WORKSPACE_EVENT_VERSION);
  };

  const isLoading = isFiltersLoading || labelsLoading;
  const showEmptyState = !isLoading && filters.length === 0;
  return (
    <FiltersTableContainer>
      {!isLoading &&
        filters.map((filter, index) => (
          <FilterRow
            filter={filter}
            folders={folders}
            index={index}
            isLastRow={index === filters.length - 1}
            key={filter.id}
            labels={labels}
          />
        ))}
      {showEmptyState && (
        <EmptyContainer>
          <Illustration illustration={Illustrations.FilterEmpty} />
          <EmptyFilterText>
            <Typography color='secondary' weight={TypographyWeight.MEDIUM}>
              No filters yet
            </Typography>
            <Typography align={Alignment.CENTER} color='disabled' wrap>
              Organize your inbox by creating filters {isMobile && 'through a desktop web browser or the desktop app'}
            </Typography>
          </EmptyFilterText>
          {!isMobile && (
            <Button onClick={openNewFilterModal} type={Type.SECONDARY}>
              Create new filter
            </Button>
          )}
        </EmptyContainer>
      )}
      {isLoading && (
        <LoadingContainer>
          <CustomCircularProgress />
        </LoadingContainer>
      )}
    </FiltersTableContainer>
  );
};
