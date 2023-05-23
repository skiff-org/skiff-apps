import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';

import { InjectedPopUpProps } from './createPopUp';
import CustomMenu from './CustomMenu';
import CustomMenuItem, { CustomMenuItemSeparator } from './CustomMenuItem';
import UICommand from './UICommand';

class CommandMenu extends React.PureComponent<
  {
    commandGroups: Array<Record<string, UICommand>>;
    commandIcons?: Array<string | React.ReactElement<any> | null>;
    dispatch: (tr: Transaction) => void;
    editorState: EditorState;
    editorView?: EditorView | null;
    onCommand?: ((...args: Array<any>) => any) | null;
  } & InjectedPopUpProps
> {
  _activeCommand: UICommand | null | undefined = null;

  render() {
    const { commandGroups, commandIcons, editorState, editorView } = this.props;
    const children: JSX.Element[] = [];
    const jj = commandGroups.length - 1;
    commandGroups.forEach((group, ii) => {
      Object.keys(group).forEach((label, kk) => {
        const command = group[label];
        const icon = commandIcons ? commandIcons[kk] : undefined;
        let disabled = true;

        try {
          disabled = !editorView || !command.isEnabled(editorState, editorView);
        } catch (ex) {
          disabled = false;
        }

        children.push(
          <CustomMenuItem
            active={command.isActive(editorState)}
            dataTest={`menu-item-${label}`}
            disabled={disabled}
            icon={icon}
            key={label}
            label={command.renderLabel(editorState) || label}
            onClick={this._onUIEnter}
            onMouseEnter={this._onUIEnter}
            value={command}
          />
        );
      });

      if (ii !== jj) {
        children.push(<CustomMenuItemSeparator key={`${String(ii)}-hr`} />);
      }
    });
    return <CustomMenu>{children}</CustomMenu>;
  }

  _onUIEnter = (command: UICommand, event: React.SyntheticEvent): void => {
    if (command.shouldRespondToUIEvent(event)) {
      if (this._activeCommand) {
        this._activeCommand.cancel();
      }
      this._activeCommand = command;

      this._execute(command, event);
    }
  };

  _execute = (command: UICommand, e: React.SyntheticEvent) => {
    const { dispatch, editorState, editorView, onCommand } = this.props;

    if (command.execute(editorState, dispatch, editorView, e)) {
      onCommand?.();
    }
  };
}

export default CommandMenu;
