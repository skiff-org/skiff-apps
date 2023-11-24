import { Size } from 'nightwatch-ui';
import { useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { NwContentType } from 'skiff-graphql';
import styled from 'styled-components';

import { PreviewComponent, PreviewComponentProps } from '../RecentFilePreview.types';

import LoadingPreview from './LoadingPreview';
import UnknownPreview from './UnknownPreview';

// when using mobile, should force width to be 100%.
// when using desktop, to be max of 75vh (unless overridden by the prop)
const StyledImg = styled.img<{ $compact?: boolean; $maxHeight?: string }>`
  user-select: none;
  ${(props) =>
    !isMobile &&
    !props.$compact &&
    `
    gap: 2px;
  `}

  ${(props) =>
    !isMobile &&
    props.$compact &&
    `
    width: auto;
    height: 100%;
    overflow: hidden;
  `}

  ${(props) =>
    isMobile &&
    props.$compact &&
    `
    width: auto;
    max-width: 36px;
    height: 36px;
    border: 1px solid var(--border-secondary);
    border-bottom: 2px solid var(--border-secondary);
    aspect-ratio: 1;
    border-radius: 8px;
    box-sizing: border-box;
  `}
  ${(props) =>
    isMobile &&
    !props.$compact &&
    `
    width: auto;
    max-height: 60vh;
  `}
`;

const ImagePreview: PreviewComponent = (props: PreviewComponentProps) => {
  const { data, compact, maxHeight, mimeType, className } = props;
  const isHeic = mimeType === 'image/heic';
  const [imageDataUrlIfHeic, setImageDataUrlIfHeic] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    const loadHeic = async () => {
      try {
        if (!data.startsWith('blob:')) {
          return;
        }
        const res = await fetch(data);
        const blob = await res.blob();
        const { default: heic2any } = await import('heic2any');
        const conversionResult = (await heic2any({ blob })) as Blob;
        const blobURL = URL.createObjectURL(conversionResult);
        setImageDataUrlIfHeic(blobURL);
      } catch (error) {
        console.error('Error converting HEIC', error);
        setPreviewFailed(true);
      }
    };
    void loadHeic();
  }, [data]);

  if (isHeic) {
    if (previewFailed) {
      return (
        <UnknownPreview
          showEmptyIllustration
          {...props}
          contentType={NwContentType.File}
          fileName=''
          fileTypeLabel=''
          tooLargeForPreview
        />
      );
    } else if (imageDataUrlIfHeic) {
      return (
        <StyledImg
          className={className}
          $compact={compact}
          $maxHeight={maxHeight}
          draggable={false}
          src={imageDataUrlIfHeic}
        />
      );
    } else {
      return <LoadingPreview size={Size.MEDIUM} />;
    }
  }

  return <StyledImg className={className} $compact={compact} $maxHeight={maxHeight} draggable={false} src={data} />;
};

export default ImagePreview;
