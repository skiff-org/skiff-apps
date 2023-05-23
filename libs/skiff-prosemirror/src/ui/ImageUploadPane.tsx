import './skiff-form.css';
import './skiff-image-url-editor.css';

import { EditorState } from 'prosemirror-state';
import React from 'react';
import { IMAGE_MIME_TYPES } from 'skiff-front-utils';

import { getCustomState } from '../skiffEditorCustomStatePlugin';

import { ENTER } from './KeyCodes';

class ImageUploadPane extends React.PureComponent<
  {
    editorState: EditorState;
    close: (href?: string | null) => void;
  },
  any
> {
  constructor(props: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    super(props);
    this.state = {
      editorState: this.props.editorState
    };
  }

  _onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.keyCode === ENTER) {
      e.preventDefault();

      this._apply();
    }
  };

  componentDidMount(): void {
    const input = document.getElementById('prosemirror-input-dialog');
    input?.click();
  }

  _cancel = (): void => {
    this.props.close?.();
  };

  _apply = (): void => {};

  render(): React.ReactElement<any> {
    const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault();
      const { createCacheElement } = getCustomState(this.props.editorState);
      const files = event?.target?.files;
      const onClose = this.props.close;
      if (FileReader && files && files.length && createCacheElement) {
        const file = files[0];
        const { type } = file;
        if (!IMAGE_MIME_TYPES.includes(type)) {
          throw new Error(`ImagePlugin: Cannot upload type ${type}`);
        }
        const fr = new FileReader();
        fr.onload = async () => {
          const cacheElemData = await createCacheElement(await file.arrayBuffer(), file.type);
          onClose?.(cacheElemData);
        };
        fr.readAsDataURL(files[0]);
      }
    };
    return (
      <>
        <input
          id='prosemirror-input-dialog'
          accept={IMAGE_MIME_TYPES.join(',')}
          type='file'
          onChange={(e) => {
            void handleUpload(e);
          }}
          style={{ opacity: 0, pointerEvents: 'none' }}
        />
      </>
    );
  }
}

export default ImageUploadPane;
