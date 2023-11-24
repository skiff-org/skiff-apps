import React, { Suspense } from 'react';
const PinchZoom = React.lazy(() => import('./PinchZoom'));

interface PinchZoomProps {
  enabled: boolean;
  contentDocument?: Document;
}
export default function LazyPinchZoom({ enabled, contentDocument }: PinchZoomProps) {
  // When disabled return null (on desktop)
  if (!enabled) return null;
  // When enabled we want to lazy load the PinchZoom Component
  return (
    // While the pinch to zoom component is loading we show the mail content just without pinch to zoom functionality
    // So as the suspense fallback we show nothing
    <Suspense fallback={React.Fragment}>
      <PinchZoom contentDocument={contentDocument} />
    </Suspense>
  );
}
