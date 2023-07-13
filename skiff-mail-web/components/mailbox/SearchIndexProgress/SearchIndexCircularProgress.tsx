import { CircularProgress, Size, CircularProgressSize, PROGRESS_SIZE } from '@skiff-org/skiff-ui';
import React from 'react';
import { Logo } from 'skiff-front-utils';
import { SearchIndexProgress } from 'skiff-graphql';
import styled from 'styled-components';

const CircularProgressContainer = styled.div<{ size: number }>`
  position: relative;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
`;

const LogoOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
`;

interface SearchIndexCircularProgressProps {
  searchIndexProgress: SearchIndexProgress;
  circularProgressSize: CircularProgressSize;
  logoBgSize?: number;
  logoSize?: Size;
}

const SearchIndexCircularProgress: React.FC<SearchIndexCircularProgressProps> = ({
  searchIndexProgress: { numThreadsIndexed, numIndexableThreads },
  circularProgressSize,
  logoBgSize,
  logoSize
}: SearchIndexCircularProgressProps) => (
  <CircularProgressContainer size={PROGRESS_SIZE[circularProgressSize]}>
    <LogoOverlay>
      <Logo bgColor='var(--bg-overlay-primary)' bgSize={logoBgSize} iconColor='disabled' size={logoSize} />
    </LogoOverlay>
    <CircularProgress
      progress={(numThreadsIndexed / numIndexableThreads) * 100}
      progressColor='var(--border-primary)'
      size={circularProgressSize}
    />
  </CircularProgressContainer>
);
export default SearchIndexCircularProgress;
