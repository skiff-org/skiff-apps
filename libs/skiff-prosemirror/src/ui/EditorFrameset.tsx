import './skiff-editor-frameset.css';

import cx from 'classnames';
import React from 'react';

export type EditorFramesetProps = {
  body?: React.ReactElement<any> | null;
  className?: string | null;
  embedded?: boolean | null;
  header?: React.ReactElement<any> | null;
  height?: (string | number) | null;
  toolbarPlacement?: 'header' | 'body' | null;
  toolbar?: React.ReactElement<any> | null;
  sidePanel?: React.ReactElement<any> | null;
  width?: (string | number) | null;
};
export const FRAMESET_BODY_CLASSNAME = 'skiff-editor-frame-body';

function toCSS(val?: (number | string) | null): string {
  if (typeof val === 'number') {
    return `${val}px`;
  }

  if (val === undefined || val === null) {
    return 'auto';
  }

  return String(val);
}

class EditorFrameset extends React.PureComponent<EditorFramesetProps> {
  render() {
    const { sidePanel, body, className, embedded, header, height, toolbarPlacement, toolbar, width } = this.props;
    const useFixedLayout = width !== undefined || height !== undefined;
    const mainClassName = cx(className, {
      'skiff-editor-frameset': true,
      'with-fixed-layout': useFixedLayout,
      embedded
    });
    const mainStyle = {
      width: toCSS(width === undefined && useFixedLayout ? '100%' : width || '100%'),
      height: toCSS(height === undefined && useFixedLayout ? 'auto' : height)
    };
    const transparentStyle = {
      background: 'rgba(0, 0, 0, 0)'
    };
    const toolbarHeader = toolbarPlacement === 'header' || !toolbarPlacement ? toolbar : null;
    const toolbarBody = toolbarPlacement === 'body' && toolbar;
    return (
      <div
        className={mainClassName}
        style={{
          ...mainStyle,
          ...transparentStyle
        }}
      >
        <div className='skiff-editor-frame-main' style={transparentStyle}>
          <div className='skiff-editor-frame-head' style={transparentStyle}>
            {header}
            {toolbarHeader}
          </div>
          <div className={FRAMESET_BODY_CLASSNAME} data-test='editor-body'>
            {toolbarBody}
            <div className='skiff-editor-frame-body-scroll' style={transparentStyle}>
              {body}
            </div>
          </div>
          <div className='skiff-editor-frame-sidepanel'>{sidePanel}</div>
          <div className='skiff-editor-frame-footer' />
        </div>
      </div>
    );
  }
}

export default EditorFrameset;
