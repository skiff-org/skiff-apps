import dayjs from 'dayjs';
import { Icon, AccentColor, Size, ThemeMode } from 'nightwatch-ui';
import React from 'react';
import styled from 'styled-components';

import FilePreviewDisplay from './FilePreviewDisplay';
import { PreviewObject, PreviewSize } from './RecentFilePreview.types';

export const GETTING_STARTED_PREVIEW_ID = 'getting-started';

export interface FilePreviewData {
  id: string;
  title: string;
  preview?: PreviewObject;
  placeholderIcon: Icon;
  theme?: ThemeMode;
  placeholderColor?: AccentColor;
  subtitle?: string | number | Date | dayjs.Dayjs | React.ReactElement;
  onClick: (evt: React.MouseEvent<HTMLElement>) => void;
  onMiddleClick?: (evt: React.MouseEvent<HTMLElement>) => void;
  error?: string;
  refetch?: () => void;
  progress?: number;
}

// Used to calculate number of previews shown in RecentlyViewedFiles.tsx
export const RECENT_FILE_PREVIEW_CARD_WIDTH = 180;
export const RECENT_FILE_PREVIEW_CARD_GAP = 20;

const FilePreviewCard = styled.div<{ $isDarkMode?: boolean }>`
  box-sizing: border-box;

  width: ${RECENT_FILE_PREVIEW_CARD_WIDTH}px;

  height: 224px;

  cursor: pointer !important;
  transition: all 0.2s ease-in-out;

  background: var(--bg-l3-solid);
  box-shadow: var(--shadow-l1) !important;
  border: 1px solid ${(props) => (props.$isDarkMode ? 'var(--border-secondary)' : 'transparent')};
  border-radius: 12px !important;
  overflow: hidden;
  color: ${(props) => (props.$isDarkMode ? 'var(--text-always-white) !important' : '')};

  &:hover {
    ${(props) => (props.$isDarkMode ? 'border: 1px solid var(--border-hover);' : '')};
    box-shadow: var(--shadow-l2) !important;
  }
`;

const FilePreviewThumbnail = styled.div`
  align-self: center;
  width: 100%;
  height: 100%;
  align-items: center;
  text-align: -webkit-center;
  text-align: center;
  background: var(--bg-l3-solid);
  overflow: hidden;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  position: relative;
  display: flex;
  justify-content: center;

  .img {
    align-self: center;
    justify-self: center;
  }

  .react-pdf__Document {
    position: absolute;
  }

  .react-pdf__Document canvas {
    width: 100% !important;
    height: auto !important;
  }
`;

/**
 * Component that renders the FilePreview icons under RecentlyViewed section.
 */
const RecentFilePreview: React.FC<FilePreviewData> = ({
  theme,
  placeholderIcon,
  onClick,
  onMiddleClick,
  error,
  refetch,
  progress,
  preview,
  title
}) => {
  return (
    <FilePreviewCard
      $isDarkMode={theme === ThemeMode.DARK}
      onClick={(e: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (e.button === 1 && onMiddleClick) {
          onMiddleClick(e);
        } else {
          onClick(e);
        }
      }}
    >
      <div
        id={GETTING_STARTED_PREVIEW_ID}
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          overflow: 'hidden'
        }}
      >
        <FilePreviewThumbnail onClick={onClick}>
          <FilePreviewDisplay
            error={error}
            fileProps={preview}
            placeholderIcon={placeholderIcon}
            progress={progress}
            progressSize={Size.X_MEDIUM}
            refetch={refetch}
            size={PreviewSize.Large}
            title={title}
          />
        </FilePreviewThumbnail>
      </div>
    </FilePreviewCard>
  );
};

export default RecentFilePreview;
