import './skiff-color-editor.css';

import React from 'react';
import { HIGHLIGHT_COLORS, TEXT_COLORS } from 'skiff-front-utils';

import CustomButton from './CustomButton';

class ColorEditor extends React.PureComponent<{
  close: (hex: string) => void;
  hex?: string | null;
  highlight: boolean;
}> {
  _renderColor = (color: string, index: number): React.ReactElement<any> => {
    const selectedColor = this.props.hex;
    // TODO: update to use theme
    const isWhite = color === 'var(--text-inverse)';
    const isTransparent = color === 'var(--editor-highlight-transparent)';
    const style = {
      width: '28px',
      height: '28px',
      marginRight: '6px',
      marginBottom: '6px',
      border: isWhite || isTransparent ? '1px solid #bfbfbf' : 'none',
      background: isTransparent
        ? 'linear-gradient(to bottom right, transparent calc(50% - 1px), red calc(50% - 1px), red calc(50% + 1px), transparent calc(50% + 1px))'
        : color
    };
    const active = selectedColor?.toLowerCase() === color;
    return (
      <CustomButton
        active={active}
        className='skiff-color-editor-cell'
        dataTest={`color-button-${color}`}
        key={`${color}-${index}`}
        label=''
        onClick={this._onSelectColor}
        style={style}
        value={color}
      />
    );
  };

  _onSelectColor = (hex: string): void => {
    this.props.close?.(hex);
  };

  render(): React.ReactElement<any> {
    const renderColor = this._renderColor;
    return (
      <div className='skiff-color-editor'>
        <div
          className='skiff-color-editor-section'
          data-test='text-color-pallet'
          style={{
            textAlign: 'center',
            display: 'inline-block',
            margin: '0 auto'
          }}
        >
          {this.props.highlight
            ? Object.keys(HIGHLIGHT_COLORS).map((key, idx) => renderColor(HIGHLIGHT_COLORS[key], idx))
            : Object.keys(TEXT_COLORS).map((key, idx) => renderColor(TEXT_COLORS[key], idx))}
        </div>
      </div>
    );
  }
}

export default ColorEditor;
