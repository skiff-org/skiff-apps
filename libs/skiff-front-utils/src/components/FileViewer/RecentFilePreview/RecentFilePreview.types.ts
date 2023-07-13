import { Color, CircularProgressSize, Icon } from '@skiff-org/skiff-ui';
import { FC } from 'react';
import { NwContentType } from 'skiff-graphql';

export const DEFAULT_FILE_TYPE_LABEL = 'FILE';

export interface PreviewObject {
  data: string;
  tooLargeForPreview: boolean;
  contentType: NwContentType;
  fileTypeLabel: string;
  fileName: string;
  mimeType?: string;
  text?: string;
  tryToOpenProtectedPdf?: boolean;
  fileSizeBytes?: number;
}

export type PreviewComponentProps = Pick<PreviewObject, 'data'> & { compact?: boolean; maxHeight?: string };

export type PreviewComponent = FC<PreviewComponentProps>;

export enum PreviewSize {
  Small,
  Large
}

export type PreviewDisplayProps = {
  fileProps?: PreviewObject;
  /** pass 0 for infinite loader */
  progress?: number;
  progressSize?: CircularProgressSize;
  error?: string;
  refetch?: () => void;
  placeholderIcon?: Icon;
  iconColor?: Color;
  size: PreviewSize;
  title?: string;
  showEmptyIllustration?: boolean;
};
