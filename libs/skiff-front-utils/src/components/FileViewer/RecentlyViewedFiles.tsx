import range from 'lodash/range';
import { Skeleton, ThemeMode } from 'nightwatch-ui';
import React, { useEffect, useRef, useState } from 'react';
import { isMobile } from 'react-device-detect';
import styled from 'styled-components';

import RecentFilePreview, {
  FilePreviewData,
  RECENT_FILE_PREVIEW_CARD_GAP,
  RECENT_FILE_PREVIEW_CARD_WIDTH
} from './RecentFilePreview';

const RecentlyViewedContainer = styled.div`
  width: 100%;
  margin: ${isMobile ? '0 30px 30px 30px' : '0'};
`;

const RecentlyViewedFilesContainer = styled.div<{ filePreviewsLength: number }>`
  min-height: fit-content;
  height: 66%;
  width: 100%;
  max-height: 66%;
  display: inline-flex;
  justify-content: left;
  align-items: center;
  gap: 20px;
  margin-bottom: ${(props) => (props.filePreviewsLength !== 0 ? '18px' : '0px')};
`;

interface RecentlyViewedFilesProps {
  filePreviews: FilePreviewData[];
  loading?: boolean;
  theme?: ThemeMode;
  showEmpty?: boolean;
}

/**
 * Component that renders the recently viewed files.
 */
const RecentlyViewedFiles: React.FC<RecentlyViewedFilesProps> = ({
  filePreviews,
  loading = false,
  theme,
  showEmpty
}) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const [previewWidth, setPreviewWidth] = useState<number | null>();

  useEffect(() => {
    setPreviewWidth(previewRef?.current?.getBoundingClientRect().width);
  }, [previewRef]);

  useEffect(() => {
    const updateWidth = () => {
      setPreviewWidth(previewRef?.current?.getBoundingClientRect().width);
    };
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Used if ref is null, width - expected SidePanel
  const DEFAULT_WINDOW_WIDTH = window.innerWidth - 380;

  const numPreviews =
    (previewWidth ?? DEFAULT_WINDOW_WIDTH) / (RECENT_FILE_PREVIEW_CARD_WIDTH + RECENT_FILE_PREVIEW_CARD_GAP);

  const displayedPreviews = filePreviews.slice(0, numPreviews);

  // empty folder
  if (showEmpty) {
    return null;
  }

  return (
    <RecentlyViewedContainer ref={previewRef}>
      <RecentlyViewedFilesContainer filePreviewsLength={displayedPreviews.length}>
        {!loading &&
          displayedPreviews.map((file, index: number) => (
            <RecentFilePreview {...file} progress={file.progress || (loading ? 0 : undefined)} theme={theme} />
          ))}
        {loading &&
          range(numPreviews).map((idx) => <Skeleton height='224px' key={idx} borderRadius={16} width='180px' />)}
      </RecentlyViewedFilesContainer>
    </RecentlyViewedContainer>
  );
};

export default RecentlyViewedFiles;
