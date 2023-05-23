import { DirectEditorProps, EditorView } from 'prosemirror-view';
import React from 'react';

import { EditorProps } from './Editor'; // https://github.com/ProseMirror/prosemirror-view/blob/master/src/index.js

class CustomEditorView extends EditorView {
  disabled: boolean;

  placeholder: (string | React.ReactElement<any>) | null | undefined;

  readOnly: boolean;

  // This is handled by super. In the future these should be moved into EditorCustomState
  // then this file can be deleted ( hopefully )
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  props: EditorProps & DirectEditorProps;

  constructor(place: HTMLElement, props: EditorProps & DirectEditorProps) {
    super(place, props);
    this.readOnly = true;
    this.disabled = true;
    this.placeholder = null;
  }

  destroy() {
    super.destroy();
  }
}

export default CustomEditorView;
