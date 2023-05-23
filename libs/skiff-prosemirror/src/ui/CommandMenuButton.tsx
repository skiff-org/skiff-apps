import './skiff-custom-menu-button.css';

import cx from 'classnames';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { ComponentProps } from 'react';

import CommandMenu from './CommandMenu';
import createPopUp from './createPopUp';
import CustomButton from './CustomButton';
import { PopUpHandle } from './PopUp';
import UICommand from './UICommand';
import uuid from './uuid';

class CommandMenuButton extends React.PureComponent<
  {
    className?: string | null;
    commandGroups: Array<Record<string, UICommand>>;
    commandIcons?: Array<string | React.ReactElement<any> | null>;
    disabled?: boolean | null;
    dispatch: (tr: Transaction) => void;
    editorState: EditorState;
    editorView?: EditorView | null;
    icon?: string | React.ReactElement<any> | null;
    label?: string | React.ReactElement<any> | null;
    title?: string | null;
    enableButtonStyle?: boolean;
    dataTest?: string;
  },
  { expanded: boolean }
> {
  _menu: PopUpHandle<ComponentProps<typeof CommandMenu>> | null = null;

  _id = uuid();

  state = {
    expanded: false
  };

  componentWillUnmount(): void {
    this._hideMenu();
  }

  _onClick = (): void => {
    const expanded = !this.state.expanded;
    this.setState({
      expanded
    });
    if (expanded) {
      this._showMenu();
    } else {
      this._hideMenu();
    }
  };

  _hideMenu = (): void => {
    const menu = this._menu;
    this._menu = null;
    menu?.close();
  };

  _showMenu = (): void => {
    const menu = this._menu;
    const menuProps = {
      ...this.props,
      onCommand: this._onCommand
    };

    if (menu) {
      menu.update(menuProps);
    } else {
      this._menu = createPopUp(CommandMenu, menuProps, {
        anchor: document.getElementById(this._id),
        onClose: this._onClose
      });
    }
  };

  _onCommand = (): void => {
    this.setState({
      expanded: false
    });

    this._hideMenu();
  };

  _onClose = (): void => {
    if (this._menu) {
      this.setState({
        expanded: false
      });
      this._menu = null;
    }
  };

  render() {
    const {
      className,
      label,
      commandGroups,
      editorState,
      editorView,
      icon,
      disabled,
      title,
      enableButtonStyle,
      dataTest
    } = this.props;
    const enabled =
      !!enableButtonStyle ||
      (!disabled &&
        commandGroups.some((group) =>
          Object.keys(group).some((curLabel) => {
            const command = group[curLabel];
            let disabledVal = true;

            try {
              disabledVal = !editorView || !command.isEnabled(editorState, editorView);
            } catch (ex) {
              disabledVal = false;
            }

            return !disabledVal;
          })
        ));
    const { expanded } = this.state;
    const buttonClassName = cx(className, {
      'skiff-custom-menu-button': true,
      'skiff-custom-menu-dropdown-button': !title,
      // dropdowns use label not title
      expanded
    });
    return (
      <CustomButton
        className={buttonClassName}
        dataTest={dataTest}
        disabled={!enabled}
        icon={icon}
        id={this._id}
        label={label?.toString()}
        onClick={this._onClick}
        title={title}
      />
    );
  }
}

export default CommandMenuButton;
