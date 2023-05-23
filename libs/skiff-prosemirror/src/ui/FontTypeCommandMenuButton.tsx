import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import FontTypeCommand from '../FontTypeCommand';
import { FontNameIds, FontNameLabels } from '../FontTypeMarkSpec';

import CommandMenuButton from './CommandMenuButton';
import findActiveFontType from './findActiveFontType';
import Icon from './Icon';
import withDropdownIcon from './withDropdownIcon';

const FONT_TYPE_COMMANDS: Record<string, any> = {};

Object.keys(FontNameIds).forEach((name) => {
  FONT_TYPE_COMMANDS[name] = new FontTypeCommand(FontNameIds[name], FontNameLabels[name]);
});
const COMMAND_GROUPS = [FONT_TYPE_COMMANDS];

class FontTypeCommandMenuButton extends React.PureComponent<{
  dispatch: (tr: Transaction) => void;
  editorState: EditorState;
  editorView?: EditorView | null;
  enableButtonStyle?: boolean;
}> {
  render() {
    const { dispatch, editorState, editorView, enableButtonStyle } = this.props;
    const fontType = findActiveFontType(editorState);
    return withDropdownIcon(
      <CommandMenuButton
        className='width-100 right-gutter'
        commandGroups={COMMAND_GROUPS}
        commandIcons={[Icon.get('text'), Icon.get('text-serif'), Icon.get('text-mono')]}
        dataTest='font-menu'
        dispatch={dispatch}
        editorState={editorState}
        editorView={editorView}
        enableButtonStyle={enableButtonStyle}
        label={fontType}
      />
    );
  }
}

export default FontTypeCommandMenuButton;
