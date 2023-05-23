import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import CustomButton from './CustomButton';
import UICommand from './UICommand';

class CommandButton extends React.PureComponent<{
  className?: string | null;
  command: UICommand;
  disabled?: boolean | null;
  dispatch?: (tr: Transaction) => void;
  editorState: EditorState;
  editorView?: EditorView | null;
  icon?: string | React.ReactElement<any> | null;
  label?: string | null;
  title?: string | null;
  style?: Record<string, any>;
  enableButtonStyle?: boolean;
}> {
  render() {
    const { label, className, command, editorState, editorView, icon, title, style, enableButtonStyle } = this.props;
    let { disabled } = this.props;

    if (!!disabled === false) {
      disabled = (!editorView || !command.isEnabled(editorState, editorView)) && !enableButtonStyle;
    }
    return (
      <CustomButton
        active={command.isActive(editorState)}
        className={className}
        disabled={!!disabled}
        icon={icon}
        label={label}
        onClick={this._onUIEnter}
        onMouseEnter={this._onUIEnter}
        style={style}
        title={title}
        value={command}
      />
    );
  }

  _onUIEnter = (command: UICommand, event: React.SyntheticEvent): void => {
    if (command.shouldRespondToUIEvent(event)) {
      this._execute(command, event);
    }
  };

  _execute = (value: any, event: React.SyntheticEvent): void => {
    const { command, editorState, dispatch, editorView } = this.props;
    command.execute(editorState, dispatch, editorView, event);
  };
}

export default CommandButton;
