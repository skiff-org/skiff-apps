import { Skeleton } from '@mui/material';
import { ImageOptions } from '@tiptap/extension-image';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { useEffect, useState } from 'react';

import { b64ToImageUrl } from './utils';

/**
 * node view for the image node
 */

const ImageNodeView = ({ node, selected }: NodeViewProps<ImageOptions>) => {
  const { src, alt, title }: { [key: string]: string } = node.attrs;

  const [blobUrlSrc, serBlobUrlSrc] = useState<string>();

  useEffect(() => {
    if (src.startsWith('data') && src.includes('base64')) {
      void b64ToImageUrl(src).then((url) => {
        serBlobUrlSrc(url);
      });
    }
  }, [src]);

  return (
    <NodeViewWrapper>
      {src.startsWith('cid') ? (
        <Skeleton style={{ width: 100, height: 100 }} />
      ) : (
        <img
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
