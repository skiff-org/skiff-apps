import './skiff-form.css';

import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React, { ChangeEvent } from 'react';

import FontSizeCommand from '../FontSizeCommand';

import findActiveFontSize from './findActiveFontSize';

export const FONT_PX_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48, 60, 72, 90];
const MIN_FONT_SIZE = 6;
const MAX_FONT_SIZE = 600;

class FontSizeCommandMenuButton extends React.PureComponent<
  {
    dispatch: (tr: Transaction) => void;
    editorState: EditorState;
    editorView?: EditorView | null;
  },
  { curFontSize: string }
> {
  // state of the current font size set by the font size input
  // text field. onEnter, update selected text to have the same
  // font size.
  state = {
    curFontSize: findActiveFontSize(this.props.editorState)
  };

  componentDidUpdate() {
    if (document.getElementById('font-size-input') !== document.activeElement) {
      this._updateFontSize(findActiveFontSize(this.props.editorState));
    }
  }

  _onFontSizeChange = (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    this.setState({
      curFontSize: e.target.value
    });
  };

  _onFontSizeKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      const { dispatch, editorState, editorView } = this.props;
      const { curFontSize } = this.state;
      // clamp font size values
      const fontSize = Math.min(Math.max(Number(curFontSize), MIN_FONT_SIZE), MAX_FONT_SIZE);
      const newSzCmd = new FontSizeCommand(fontSize);
      newSzCmd.execute(editorState, dispatch, editorView);
      e.preventDefault();
    }
  };

  _updateFontSize = (size: string) => {
    this.setState({
      curFontSize: size
    });
  };

  render() {
    const { editorState } = this.props;
    const fontSize = findActiveFontSize(editorState);
    const { curFontSize } = this.state;
    return (
      <div
        style={{
          lineHeight: 32,
          display: 'inline-flex',
          position: 'inherit'
        }}
      >
        <input
          autoFocus
          className='input-field'
          data-test='font-size-input'
          id='font-size-input'
          onChange={this._onFontSizeChange}
          onKeyDown={this._onFontSizeKeyDown}
          placeholder={fontSize}
          value={curFontSize}
        />
      </div>
    );
  }
}

export default FontSizeCommandMenuButton;
