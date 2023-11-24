import { CircularProgress, Size, Typography, TypographySize } from 'nightwatch-ui';
import { useState } from 'react';
import { bytesToGb, bytesToMb, bytesToTb, gbToTb, mbToGb } from 'skiff-utils';
import styled, { css } from 'styled-components';

const StorageSection = styled.div<{ $enabled: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 10px 8px 10px 12px;
  height: 32px;
  margin: 0 6px;
  max-height: 32px;
  border-radius: 4px;
  box-sizing: border-box;
  user-select: none;
  align-items: center;
  gap: 8px;
  ${(props) =>
    props.$enabled &&
    css`
      cursor: pointer;
      &:hover {
        background: var(--bg-overlay-tertiary);
      }
    `}
`;

const LinearSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const LinearTextSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ProgressBarContainer = styled.div`
  height: 4px;
  width: 100%;
  border-radius: 100px;
  background: var(--bg-overlay-tertiary);
`;

const Filler = styled.div<{ $completed: number }>`
  height: 100%;
  width: ${({ $completed }) => $completed}%;
  background: var(--icon-link);
  border-radius: 100px;
  transition: width 1s linear;
`;

const StorageNumbers = styled(Typography)<{ isVisible: boolean }>`
  visibility: ${({ isVisible }) => (isVisible ? 'visible' : 'hidden')};
`;

type ProgressBarProps = {
  completed?: number;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ completed }: ProgressBarProps) => {
  if (completed === undefined) return <></>;
  return (
    <ProgressBarContainer>
      <Filler $completed={completed} />
    </ProgressBarContainer>
  );
};

interface StorageBarProps {
  /** Undefined when storage numbers are still loading */
  maxStorageMegabytes: number | undefined;
  /** Undefined when storage numbers are still loading */
  storageBytesUsed: number | undefined;
  onClick?: () => void;
  linear?: boolean;
  swap?: boolean;
}

const formatStorageSigFig = (value: number) => {
  const stringValue = value.toFixed(2);
  return stringValue.endsWith('.00') ? stringValue.split('.')[0] : stringValue;
};

/**
 * Displays the amount of storage used out of the total limit
 */
const StorageBar = (props: StorageBarProps) => {
  const { maxStorageMegabytes = 0, storageBytesUsed = 0, swap, linear, onClick } = props;
  const usagePercent = (bytesToMb(storageBytesUsed) / maxStorageMegabytes) * 100;
  const storageBytesUsedGB = bytesToGb(storageBytesUsed).toFixed(2);
  const storageBytesUsedTB = bytesToTb(storageBytesUsed).toFixed(2);
  const bar = <CircularProgress progress={usagePercent} progressColor='link' size={Size.SMALL} spinner={false} />;
  const maxStorageGB = mbToGb(maxStorageMegabytes);
  const maxStorageTB = gbToTb(maxStorageGB);
  const isMaxTB = mbToGb(maxStorageMegabytes) >= 1000;
  const storageUsed = isMaxTB ? storageBytesUsedTB : storageBytesUsedGB;
  const maxStorage = isMaxTB ? maxStorageTB : maxStorageGB;

  const unit = isMaxTB ? 'TB' : 'GB';

  const label = (
    <Typography color='secondary'>{`${storageUsed} of ${formatStorageSigFig(maxStorage)} ${unit} used`}</Typography>
  );
  const [hover, setHover] = useState(false);

  if (linear) {
    const isStorageLoaded = !!maxStorageMegabytes;
    return (
      <LinearSection>
        <ProgressBar completed={!isStorageLoaded ? 0 : usagePercent} />
        <LinearTextSection>
          <StorageNumbers size={TypographySize.SMALL} color='secondary' isVisible={isStorageLoaded}>
            {`${storageUsed || 0.0} / ${formatStorageSigFig(maxStorage)} ${unit}`}
          </StorageNumbers>
          {onClick && (
            <div onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
              <Typography color={hover ? 'secondary' : 'disabled'} size={TypographySize.SMALL} onClick={onClick}>
                Upgrade
              </Typography>
            </div>
          )}
        </LinearTextSection>
      </LinearSection>
    );
  }

  return (
    <>
      {
        <StorageSection $enabled={!!onClick} onClick={onClick}>
          {!swap && (
            <>
              {bar}
              {label}
            </>
          )}
          {swap && (
            <>
              {label}
              {bar}
            </>
          )}
        </StorageSection>
      }
    </>
  );
};

export default StorageBar;
