import dayjs from 'dayjs';
import { Icon, AccentColor, ThemeMode } from 'nightwatch-ui';
import React from 'react';

import { PreviewObject } from './RecentFilePreview.types';

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
