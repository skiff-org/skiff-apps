import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';
import { yCursorPluginKey, ySyncPluginKey } from 'y-prosemirror';

import { patchYSyncPluginTr } from '../patchYSyncPluginTr';
import { dispatchSelectionChange } from '../utils/selectionUtils';

import type { EditorProps } from './Editor';
import Editor from './Editor';
import type { EditorFramesetProps } from './EditorFrameset';
import Frag from './Frag';
import uuid from './uuid';

type Props = EditorFramesetProps &
  EditorProps & {
    theme: any;
    onChange?: (state: EditorState, docChanged: boolean, editorView?: EditorView) => void;
  };

type State = {
  editorView: EditorView | null;
};

class RichTextEditor extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props);
    this._id = uuid();
    this.state = {
      editorView: null
    };
  }

  _id: string;

  _dispatchTransaction = (tr: Transaction): void => {
    if (this.props.onChange) {
      if (tr.getMeta(yCursorPluginKey)?.awarenessUpdated === true && this.state.editorView !== null) {
        // Dispatch selectionchange now so we don't clobber a potential pending selection change
        // when yCursorPlugin renders remote cursors (it inserts/deletes <span>s in the middle of text,
        // which can confuse the browser's new selection before Prosemirror gets to see it).
        dispatchSelectionChange();
        // Need to rebase tr onto the new state.
        // From looking at the y-prosemirror source code, the only tr it dispatches
        // with a yCursorPluginKey meta key, is a tr that only has the below setMeta call.
        // So we are not missing any tr updates this way, at least with the current y-prosemirror version.
        tr = this.props.editorState.tr.setMeta(yCursorPluginKey, tr.getMeta(yCursorPluginKey));
      }
      // dispatchSelectionChange() above may have changed our props (especially editorState),
      // so we look them up directly here.
      if (this.props.onChange) {
        if (tr.getMeta(ySyncPluginKey)?.isChangeOrigin) {
          tr = patchYSyncPluginTr(this.props.editorState, tr);
        }
        const nextState = this.props.editorState.apply(tr);
        this.props.onChange(nextState, tr.docChanged, this.state.editorView ?? undefined);
      }
    }
  };

  _onReady = (editorView: EditorView): void => {
    if (editorView !== this.state.editorView) {
      this.setState({
        editorView
      });
      const { onReady } = this.props;
      onReady?.(editorView);
    }
  };

  render() {
    const {
      autoFocus,
      children,
      disabled,
      embedded,
      header,
      height,
      overlay,
      placeholder,
      isMobile,
      width,
      editorState,
      initialNodeViews,
      commentsSidepanelOpen,
      snapshotPanelOpen,
      currentID
    } = this.props;

    return (
      <Frag>
        <Editor
          header={header}
          height={height}
          width={width}
          autoFocus={autoFocus}
          disabled={disabled}
          dispatchTransaction={this._dispatchTransaction}
          editorState={editorState}
          initialNodeViews={initialNodeViews}
          embedded={embedded}
          isMobile={isMobile}
          onReady={this._onReady}
          overlay={overlay}
          placeholder={placeholder}
          commentsSidepanelOpen={commentsSidepanelOpen}
          snapshotPanelOpen={snapshotPanelOpen}
          currentID={currentID}
        />
        {children}
      </Frag>
    );
  }
}

export default RichTextEditor;
