import { Alignment, MonoTag, Size, Typography, TypographyWeight } from '@skiff-org/skiff-ui';
import pluralize from 'pluralize';
import React from 'react';
import { EmptyMailbox, MailTypography } from 'skiff-front-utils';
import { SearchIndexProgress } from 'skiff-graphql';
import styled from 'styled-components';

import SearchIndexCircularProgress from './SearchIndexCircularProgress';

const LogoLoader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  width: 296px;
`;

const InfoBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
`;

export const getSearchIndexProgressText = (center?: boolean) => (
  <>
    <Typography mono uppercase weight={TypographyWeight.MEDIUM}>
      Creating private search index
    </Typography>
    <Typography mono uppercase align={center ? Alignment.CENTER : undefined} color='secondary' wrap={center}>
      Results will be complete when your device finishes decrypting all mail.
    </Typography>
  </>
);

interface SearchIndexProgressViewProps {
  searchIndexProgress: SearchIndexProgress;
}
const SearchIndexProgressView: React.FC<SearchIndexProgressViewProps> = ({
  searchIndexProgress
}: SearchIndexProgressViewProps) => {
  return (
    <EmptyMailbox>
      <LogoLoader>
        <SearchIndexCircularProgress circularProgressSize={Size.X_LARGE} searchIndexProgress={searchIndexProgress} />
        <InfoBox>
          <MailTypography>{getSearchIndexProgressText(true)}</MailTypography>
          <MonoTag
            bgColor='var(--bg-overlay-tertiary)'
            // we're calling these emails even though they're threads to keep things colloquial;
            // the proportion is more important than unit or absolute number
            label={`${searchIndexProgress.numThreadsIndexed.toLocaleString()} / ${searchIndexProgress.numIndexableThreads.toLocaleString()} ${pluralize(
              'email',
              searchIndexProgress.numIndexableThreads
            )} indexed`}
            textColor='disabled'
          />
        </InfoBox>
      </LogoLoader>
    </EmptyMailbox>
  );
};

export default SearchIndexProgressView;
