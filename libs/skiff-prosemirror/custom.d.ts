declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

declare interface Window {
  mobileToolbarState: { [toolbarCommand: ToolbarItemsIds]: { show: boolean; enable: boolean } };
  ReactNativeWebView: {
    postMessage: (payload: string) => void;
  };
  handleOutsideToolbarClick: (itemID: ToolbarItemsIds) => void;
}
