import React from 'react';
import styled from 'styled-components';

const BarContainer = styled.div`
  width: 100%;
  height: 12px;
  background: var(--bg-overlay-tertiary);
  border-radius: 100px;
  overflow: hidden;
  position: relative;
`;

const UsedStorage = styled.div<{ usedPercentage: number }>`
  height: 100%;
  width: ${(props) => props.usedPercentage}%;
  background: var(--icon-link);
  transition: width 0.3s ease-in-out;
`;

// Types
interface BulkSilenceModalStorageBarProps {
  totalStorage: number;
  usedStorage: number;
}

// Component
const BulkSilenceModalStorageBar: React.FC<BulkSilenceModalStorageBarProps> = ({ totalStorage, usedStorage }) => {
  const usedPercentage = (usedStorage / totalStorage) * 100;

  return (
    <BarContainer>
      <UsedStorage usedPercentage={usedPercentage} />
    </BarContainer>
  );
};

export default BulkSilenceModalStorageBar;
