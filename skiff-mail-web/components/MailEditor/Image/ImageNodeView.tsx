import Skeleton from '@mui/material/Skeleton';
import { ImageOptions } from '@tiptap/extension-image';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { isDataUrl, proxyUrl } from 'skiff-front-utils';
import styled from 'styled-components';

import { imgStyling } from '../nodeStyles';

import { b64ToImageUrl } from './utils';

const StyledImage = styled.img`
  ${imgStyling}
`;

/**
 * node view for the image node
 */
const ImageNodeView = ({ node, selected }: NodeViewProps<ImageOptions>) => {
  const { src, alt, title }: { [key: string]: string } = node.attrs;
  const [proxiedSrc, setProxiedSrc] = useState<string>();
  const [blobUrlSrc, setBlobUrlSrc] = useState<string>();

  useEffect(() => {
    if (!src) return;
    if (isDataUrl(src) && src.includes('base64')) {
      setBlobUrlSrc(b64ToImageUrl(src));
    }
    const originUrl: URL = new URL(window.location.origin);
    setProxiedSrc(proxyUrl(src, originUrl) || src);
  }, [src]);

  return (
    <NodeViewWrapper
      style={{
        display: 'inline-block'
      }}
    >
      {src && src.startsWith('cid') ? (
        <Skeleton style={{ width: 100, height: 100 }} />
      ) : (
        <StyledImage
          alt={alt}
          className={selected ? 'ProseMirror-selectednode' : ''}
          data-drag-handle='true'
          src={blobUrlSrc || proxiedSrc}
          title={title}
        />
      )}
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
