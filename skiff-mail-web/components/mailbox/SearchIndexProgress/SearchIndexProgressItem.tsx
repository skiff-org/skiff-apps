import { Size } from '@skiff-org/skiff-ui';
import React from 'react';
import { SearchIndexProgress } from 'skiff-graphql';
import styled from 'styled-components';

import SearchIndexCircularProgress from './SearchIndexCircularProgress';
import { getSearchIndexProgressText } from './SearchIndexProgressView';

const Container = styled.div<{ width: number }>`
  width: ${(props) => props.width}px;
  background: var(--bg-l3-solid);
  border-bottom: 1px solid var(--border-tertiary);
  padding: 16px 20px;
`;

const InfoBox = styled.div<{ width: number }>`
  display: flex;
  gap: 12px;
  width: ${(props) => 0.75 * props.width}px;
`;

const Text = styled.div`
  display: flex;
  gap: 2px;
  flex-direction: column;
  width: 100%;
`;

interface SearchIndexProgressItemProps {
  searchIndexProgress: SearchIndexProgress;
  width: number;
}

const SearchIndexProgressItem: React.FC<SearchIndexProgressItemProps> = ({
  width,
  searchIndexProgress
}: SearchIndexProgressItemProps) => {
  return (
    <Container width={width}>
      <InfoBox width={width}>
        <SearchIndexCircularProgress
          circularProgressSize={Size.LARGE}
          logoBgSize={20}
          logoSize={Size.SMALL}
          searchIndexProgress={searchIndexProgress}
        />
        <Text>{getSearchIndexProgressText()}</Text>
      </InfoBox>
    </Container>
  );
};

export default SearchIndexProgressItem;
