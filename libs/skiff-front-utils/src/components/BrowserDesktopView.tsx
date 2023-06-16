import React from 'react';
import { BrowserView, isTablet } from 'react-device-detect';

// Same as BrowserView but without iPads
// https://github.com/duskload/react-device-detect/issues/146#issuecomment-881226784
const BrowserDesktopView = ({ children, ...props }: any) =>
  !isTablet ? <BrowserView {...props}>{children}</BrowserView> : null;

export default BrowserDesktopView;
