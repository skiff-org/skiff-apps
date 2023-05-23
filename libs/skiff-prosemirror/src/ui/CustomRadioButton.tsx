import './skiff-custom-radio-button.css';

import cx from 'classnames';
import React from 'react';

import type { PointerSurfaceProps } from './PointerSurface';
import PointerSurface from './PointerSurface';
import preventEventDefault from './preventEventDefault';
import uuid from './uuid';

class CustomRadioButton extends React.PureComponent<
  PointerSurfaceProps & {
    checked?: boolean;
    inline?: boolean | null;
    label?: string | React.ReactElement<any> | null;
    name?: string | null;
    onSelect?: ((val: any, e: React.SyntheticEvent) => void) | null;
  }
> {
  _name = uuid();

  render() {
    const { title, className, checked, label, inline, name, onSelect, disabled, ...pointerProps } = this.props;
    const klass = cx(className, 'skiff-custom-radio-button', {
      checked,
      inline
    });
    return (
      <PointerSurface {...pointerProps} className={klass} disabled={disabled} onClick={onSelect} title={title || label}>
        <input
          checked={checked}
          className='skiff-custom-radio-button-input'
          disabled={disabled}
          name={name || this._name}
          onChange={preventEventDefault}
          tabIndex={disabled ? undefined : 0}
          type='radio'
        />
        <span className='skiff-custom-radio-button-icon' />
        <span className='skiff-custom-radio-button-label'>{label}</span>
      </PointerSurface>
    );
  }
}

export default CustomRadioButton;
