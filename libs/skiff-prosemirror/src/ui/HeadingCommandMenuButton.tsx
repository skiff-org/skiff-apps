import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import HeadingCommand from '../HeadingCommand';

import CommandMenuButton from './CommandMenuButton';
import withDropdownIcon from './withDropdownIcon';

export const HEADING_SIZES = [1, 2, 3, 4];
const HEADING_SIZE_COMMANDS = HEADING_SIZES.reduce((memo, size) => {
  memo[`Heading${size}`] = new HeadingCommand(size);
  return memo;
}, {});
const COMMAND_GROUPS = [
  {
    None: new HeadingCommand(null)
  },
  HEADING_SIZE_COMMANDS
];

class HeadingCommandMenuButton extends React.PureComponent<{
  dispatch: (tr: Transaction) => void;
  editorState: EditorState;
  editorView?: EditorView | null;
  enableButtonStyle?: boolean;
}> {
  findActiveHeadingSize(editorState: EditorState): number {
    return HEADING_SIZES.reduce((active, size) => (new HeadingCommand(size).isActive(editorState) ? size : active), 0);
  }

  render() {
    const { dispatch, editorState, editorView, enableButtonStyle } = this.props;
    const activeSize = this.findActiveHeadingSize(editorState);
    return withDropdownIcon(
      <CommandMenuButton
        className='width-64'
        commandGroups={COMMAND_GROUPS}
        dataTest='heading-button'
        dispatch={dispatch}
        editorState={editorState}
        editorView={editorView}
        enableButtonStyle={enableButtonStyle}
        label={activeSize ? `H${activeSize}` : 'None'}
      />
    );
  }
}

export default HeadingCommandMenuButton;
