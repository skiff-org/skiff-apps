import { ImageOptions } from '@tiptap/extension-image';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { isDataUrl } from 'skiff-front-utils';
import styled from 'styled-components';

import { imgStyling } from '../nodeStyles';

import { Skeleton } from 'nightwatch-ui';
import { b64ToImageUrl } from './utils';

const StyledImage = styled.img`
  ${imgStyling}
`;

/**
 * node view for the image node
 */
const ImageNodeView = ({ node, selected }: NodeViewProps<ImageOptions>) => {
  const { src, alt, title }: { [key: string]: string } = node.attrs;
  const [blobUrlSrc, setBlobUrlSrc] = useState<string>();

  useEffect(() => {
    if (!src) return;
    if (isDataUrl(src) && src.includes('base64')) {
      setBlobUrlSrc(b64ToImageUrl(src));
    }
  }, [src]);

  return (
    <NodeViewWrapper
      style={{
        display: 'inline-block'
      }}
    >
      {src && src.startsWith('cid') ? (
        <Skeleton width='100px' height='100px' />
      ) : (
        <StyledImage
          alt={alt}
          className={selected ? 'ProseMirror-selectednode' : ''}
          data-drag-handle='true'
          src={blobUrlSrc || src}
          title={title}
        />
      )}
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
