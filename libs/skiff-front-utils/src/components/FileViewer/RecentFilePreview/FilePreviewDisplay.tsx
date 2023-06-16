import { Icon, Icons, Size } from 'nightwatch-ui';
import React, { Suspense } from 'react';
import { NwContentType } from 'skiff-graphql';
import styled from 'styled-components';

import { fileTypeMatcher, FileTypes } from '../../../utils/fileUtils';

import AudioPreview from './Previews/AudioPreview';
import ErrorPreview from './Previews/ErrorPreview';
import IconPreview from './Previews/IconPreview';
import ImagePreview from './Previews/ImagePreview';
import LoadingPreview from './Previews/LoadingPreview';
import SkiffPagePreview from './Previews/SkiffPagePreview';
import UnknownPreview from './Previews/UnknownPreview';
import VideoPreview from './Previews/VideoPreview';
import { PreviewDisplayProps, PreviewSize } from './RecentFilePreview.types';

const FallbackIconContainer = styled.div`
  display: 'flex';
  justify-content: 'center';
  margin-top: '16px';
`;

const PDFPreview = React.lazy(() => import('./Previews/PdfPreview'));

const FilePreviewDisplay = ({
  progress,
  progressSize,
  error,
  refetch,
  fileProps,
  placeholderIcon,
  iconColor,
  size,
  title,
  showEmptyIllustration
}: PreviewDisplayProps) => {
  // handle loading previews
  if (progress !== undefined) {
    return <LoadingPreview progress={progress} size={progressSize} />;
  }

  // handle errors previews
  if (error) {
    return <ErrorPreview error={error || 'Error: error'} refetch={refetch} size={size} />;
  }

  const FallbackIcon = ({ icon }: { icon: Icon }) => {
    return (
      <FallbackIconContainer>
        <Icons
          color={iconColor || 'secondary'}
          icon={icon}
          size={size === PreviewSize.Small ? Size.MEDIUM : Size.X_LARGE}
        />
      </FallbackIconContainer>
    );
  };

  // return placeholder incase there is no content type for the preview
  if (!fileProps?.contentType) return <FallbackIcon icon={placeholderIcon || Icon.File} />;

  const { contentType, mimeType } = fileProps;

  // handle NwContentType previews
  // if the file is Skiff Page or a pdf, render the matching preview
  switch (contentType) {
    case NwContentType.Pdf:
      return (
        <Suspense fallback={null}>
          <PDFPreview {...fileProps} size={size} />
        </Suspense>
      );
    case NwContentType.RichText:
      return <SkiffPagePreview {...fileProps} color={iconColor} icon={placeholderIcon} title={title} />;
    case NwContentType.Folder:
      return <FallbackIcon icon={placeholderIcon || Icon.Folder} />;
  }

  if (fileProps.tooLargeForPreview) {
    return <UnknownPreview {...fileProps} />;
  }

  // handle custom mimeTypes previews
  const preview = fileTypeMatcher(mimeType ?? '', {
    [FileTypes.Image]: <ImagePreview {...fileProps} />,
    [FileTypes.Icon]: <IconPreview {...fileProps} />,
    [FileTypes.Pdf]: (
      <Suspense fallback={null}>
        <PDFPreview {...fileProps} size={size} />
      </Suspense>
    ),
    [FileTypes.Video]: <VideoPreview {...fileProps} />,
    [FileTypes.Sound]: <AudioPreview {...fileProps} />,
    [FileTypes.Unknown]: <UnknownPreview showEmptyIllustration={showEmptyIllustration} {...fileProps} />
  });
  return preview;
};

export default FilePreviewDisplay;
