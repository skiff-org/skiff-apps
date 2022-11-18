import { useEffect, useState } from 'react';
import { ReactZoomPanPinchProps, TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

import { PINCH_TO_ZOOM_CONTAINER, PINCH_TO_ZOOM_CONTENT } from '../../../mailbox/consts';
import { MAIL_CONTENT_CONTAINER_ID } from '../MailHTMLView';

const PINCH_CONTENT_PLACEHOLDER = 'pinch-content-placeholder';
/**
 * Add pinch zoom and pan to mail content
 * Works by getting inserted into iframe body and replacing pinchzoom placeholder with
 * the mails content
 */
export default function PinchZoom({ contentDocument }: { contentDocument?: Document }) {
  const [isPanningDisabled, setIsPanningDisabled] = useState(true);
  const pinchProps: ReactZoomPanPinchProps = {
    panning: { disabled: isPanningDisabled, velocityDisabled: true },
    minScale: 1,
    onZoom: (ref) => setIsPanningDisabled(ref.state.scale <= 1),
    doubleClick: {
      disabled: true
    },
    limitToBounds: true,
    alignmentAnimation: {
      disabled: true,
      sizeY: contentDocument ? contentDocument.documentElement.scrollHeight * 2 : undefined, // Unfortunately bound props for this library do not work https://github.com/prc5/react-zoom-pan-pinch/issues/250
      sizeX: contentDocument ? contentDocument.documentElement.scrollWidth * 2 : undefined // This is the most accurate bound we can get for now. It think it is good enough though
    }
  };

  useEffect(() => {
    // Once the document is loaded we want to move the content inside the pinch wrapper
    const body = contentDocument?.body;
    if (!body) return;
    // Query the content
    const contentElement = body.querySelector(`#${MAIL_CONTENT_CONTAINER_ID}`);
    // Query the pinch placeholder
    const pinchPlaceholderElement = body.querySelector(`#${PINCH_CONTENT_PLACEHOLDER}`);
    // Replace pinch content div with content element
    if (contentElement && pinchPlaceholderElement) {
      contentElement.remove();
      pinchPlaceholderElement.replaceWith(contentElement);
    }
  }, [contentDocument]);

  return (
    <TransformWrapper {...pinchProps}>
      <TransformComponent
        contentClass={PINCH_TO_ZOOM_CONTENT}
        contentStyle={{ boxSizing: 'border-box', padding: '0 16px', transformOrigin: '0% 0%' }}
        wrapperClass={PINCH_TO_ZOOM_CONTAINER}
        wrapperStyle={{ overflow: 'auto hidden' }}
      >
        {/* This placeholder will get replaced with mail content */}
        <div id={PINCH_CONTENT_PLACEHOLDER} />
      </TransformComponent>
    </TransformWrapper>
  );
}
