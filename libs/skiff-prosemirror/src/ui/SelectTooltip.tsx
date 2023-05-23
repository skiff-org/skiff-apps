import './skiff-select-tooltip.css';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import { COMMENT } from '../EditorCommands';

import CommandButton from './CommandButton';
import CustomEditorView from './CustomEditorView';
import CommentIcon from './svgs/plus_comment.svg';

const icon = (
  <img
    alt=''
    src={CommentIcon}
    style={{
      width: '40px',
      height: '40px',
      margin: '12px 6px 6px 5px'
    }}
  />
);

class SelectTooltip extends React.PureComponent<{
  editorView: EditorView;
  editorState: EditorState;
}> {
  render() {
    const { editorView, editorState } = this.props;

    if (!(editorView instanceof CustomEditorView) || editorView.readOnly) {
      return null;
    }

    const label = '[comment] Comment';
    const command = COMMENT;

    // Hide the tooltip if disabled
    if (!editorView || !command.isEnabled(editorState)) {
      return null;
    }

    return (
      <div className='skiff-select-tooltip' data-test='floating-add-command-btn'>
        <CommandButton
          command={command}
          disabled={editorView.disabled}
          dispatch={editorView.props.dispatchTransaction}
          editorState={editorState}
          editorView={editorView}
          icon={icon}
          key={label}
          label={null}
          title={null}
        />
      </div>
    );
  }
}

export default SelectTooltip;
