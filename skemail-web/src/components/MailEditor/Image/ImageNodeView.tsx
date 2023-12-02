import { ImageOptions } from '@tiptap/extension-image';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import { Skeleton } from 'nightwatch-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { isDataUrl } from 'skiff-front-utils';
import styled from 'styled-components';

import { imgStyling } from '../nodeStyles';

import { b64ToImageUrl } from './utils';

const StyledImage = styled.img`
  ${imgStyling}
  min-width: 44px;
`;

const ResizeHandler = styled.div<{ $show: boolean; $imageHeight?: number; $imageWidth?: number; $marginLeft?: number }>`
  position: absolute;
  box-sizing: border-box;
  display: inline-flex;
  height: ${({ $imageHeight }) => ($imageHeight ? `${$imageHeight}px` : '50px')};
  width: ${({ $imageWidth }) => ($imageWidth ? `${$imageWidth / 4}px` : '50px')};
  transform: translateX(-50%);
  cursor: ew-resize;
  opacity: ${({ $show }) => ($show ? 1 : 0)};
  margin-left: ${({ $marginLeft }) => ($marginLeft ? `${$marginLeft}px` : '0px')};
`;

const ResizeBar = styled.div<{ $imageHeight?: number; $imageWidth?: number }>`
  border: solid 1px #fff;
  border-radius: 100px;
  background: var(--bg-emphasis);
  height: ${({ $imageHeight }) => ($imageHeight ? `${($imageHeight || 0) / 2}px` : '50px')};
  width: 8px;
  max-width: ${({ $imageWidth }) => ($imageWidth ? `${($imageWidth || 0) / 10}px` : '8px')};

  /* center */
  place-self: center;
  text-align: center;
  justify-self: center;
  margin: auto;
`;
/**
 * node view for the image node
 */
const ImageNodeView = ({ node, selected, editor, getPos }: NodeViewProps<ImageOptions>) => {
  const { src, alt, title }: { [key: string]: string } = node.attrs;
  const [blobUrlSrc, setBlobUrlSrc] = useState<string>();
  const imageRef = useRef<HTMLImageElement>(null);
  const leftResizeHandleRef = useRef<HTMLDivElement>(null);
  const rightResizeHandleRef = useRef<HTMLDivElement>(null);
  const [showBars, setShowBars] = useState(false);

  const handleMouseEnter = useCallback(() => setShowBars(true), []);
  const handleMouseLeave = useCallback(() => setShowBars(false), []);

  const imageHeight = imageRef.current?.offsetHeight;
  const imageWidth = imageRef.current?.offsetWidth;
  const imageX = imageRef.current?.getBoundingClientRect().x;

  useEffect(() => {
    const handleMousedown = (event: MouseEvent) => {
      if (!imageRef.current) {
        return;
      }

      const startX = event.pageX;
      const startWidth = imageRef.current.offsetWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (moveEvent.pageX <= (imageX || 0)) return;
        const newWidth = startWidth + moveEvent.pageX - startX;
        const transaction = editor.view.state.tr.setNodeMarkup(getPos(), undefined, {
          ...node.attrs,
          width: newWidth
        });
        editor.view.dispatch(transaction);
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    leftResizeHandleRef.current?.addEventListener('mousedown', handleMousedown);
    rightResizeHandleRef.current?.addEventListener('mousedown', handleMousedown);

    return () => {
      leftResizeHandleRef.current?.removeEventListener('mousedown', handleMousedown);
      rightResizeHandleRef.current?.removeEventListener('mousedown', handleMousedown);
    };
  }, [imageX, node.attrs, editor.view, getPos]);

  useEffect(() => {
    if (!src) return;
    if (isDataUrl(src) && src.includes('base64')) {
      setBlobUrlSrc(b64ToImageUrl(src));
    }
  }, [src]);

  return (
    <NodeViewWrapper
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        display: 'inline-block'
      }}
    >
      {src && src.startsWith('cid') ? (
        <Skeleton height='100px' width='100px' />
      ) : (
        <>
          <ResizeHandler
            $imageHeight={imageHeight}
            $imageWidth={imageWidth}
            $marginLeft={10}
            $show={showBars}
            ref={leftResizeHandleRef}
          >
            <ResizeBar $imageHeight={imageHeight} $imageWidth={imageWidth} />
          </ResizeHandler>
          <StyledImage
            alt={alt}
            className={selected ? 'ProseMirror-selectednode' : ''}
            data-drag-handle='true'
            onClick={() => {}}
            ref={imageRef}
            src={blobUrlSrc || src}
            title={title}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            width={!!node.attrs.width ? node.attrs.width : undefined}
          />
          <ResizeHandler
            $imageHeight={imageHeight}
            $imageWidth={imageWidth}
            $marginLeft={-10}
            $show={showBars}
            ref={rightResizeHandleRef}
          >
            <ResizeBar $imageHeight={imageHeight} $imageWidth={imageWidth} />
          </ResizeHandler>
        </>
      )}
    </NodeViewWrapper>
  );
};

export default ImageNodeView;
