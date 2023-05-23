import cx from 'classnames';
import React from 'react';

import preventEventDefault from './preventEventDefault';

export type PointerSurfaceProps = {
  active?: boolean | null;
  children?: any;
  className?: string | null;
  disabled?: boolean;
  id?: string | null;
  onClick?: ((val: any, e: React.SyntheticEvent) => void) | null;
  onMouseEnter?: ((val: any, e: React.SyntheticEvent) => void) | null;
  style?: Record<string, any> | null;
  title?: null | string;
  value?: any; // TODO
  label?: string | null;
  dataTest?: string;
};

class PointerSurface extends React.PureComponent<
  PointerSurfaceProps,
  {
    pressed: boolean;
  }
> {
  _clicked = false;

  _mul = false;

  _pressedTarget: Element | null = null;

  _unmounted = false;

  constructor(props: PointerSurfaceProps | Readonly<PointerSurfaceProps>) {
    super(props);
    this.state = {
      pressed: false
    };
  }

  componentWillUnmount(): void {
    this._unmounted = true;

    if (this._mul) {
      this._mul = false;
      document.removeEventListener('mouseup', this._onMouseUpCapture, true);
    }
  }

  _onMouseEnter = (e: React.SyntheticEvent): void => {
    this._pressedTarget = null;
    e.preventDefault();
    const { onMouseEnter, value } = this.props;
    onMouseEnter?.(value, e);
  };

  _onMouseLeave = (e: React.SyntheticEvent): void => {
    this._pressedTarget = null;
    const mouseUpEvent: any = e;

    this._onMouseUpCapture(mouseUpEvent);
  };

  _onMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault();
    this._pressedTarget = null;
    this._clicked = false;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (e.which === 3 || e.button === 2) {
      // right click.
      return;
    }

    this.setState({
      pressed: true
    });
    this._pressedTarget = e.currentTarget;
    this._clicked = false;

    if (!this._mul) {
      document.addEventListener('mouseup', this._onMouseUpCapture, true);
      this._mul = true;
    }
  };

  _onMouseUp = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    if (this._clicked || e.type === 'keypress') {
      const { onClick, value, disabled } = this.props;
      if (!disabled) {
        onClick?.(value, e);
      }
    }

    this._pressedTarget = null;
    this._clicked = false;
  };

  _onMouseUpCapture = (e: MouseEvent): void => {
    if (this._mul) {
      this._mul = false;
      document.removeEventListener('mouseup', this._onMouseUpCapture, true);
    }

    const { target } = e;
    this._clicked =
      this._pressedTarget instanceof HTMLElement &&
      target instanceof HTMLElement &&
      (target === this._pressedTarget || target.contains(this._pressedTarget) || this._pressedTarget?.contains(target));
    this.setState({
      pressed: false
    });
  };

  render() {
    const { className, disabled, active, id, style, title, children, label, dataTest } = this.props;
    const { pressed } = this.state;
    const buttonClassName = cx(className, {
      active,
      disabled,
      pressed
    });
    return (
      <span
        aria-disabled={disabled}
        aria-pressed={pressed}
        className={buttonClassName}
        data-test={label ? `${label?.toString().toLowerCase().split(' ').join('-').substring(1)}` : dataTest}
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        disabled={disabled}
        id={id || undefined}
        onKeyPress={disabled ? preventEventDefault : this._onMouseUp}
        onMouseDown={disabled ? preventEventDefault : this._onMouseDown}
        onMouseEnter={disabled ? preventEventDefault : this._onMouseEnter}
        onMouseLeave={disabled ? undefined : this._onMouseLeave}
        onMouseUp={disabled ? preventEventDefault : this._onMouseUp}
        role='button'
        style={style || undefined}
        tabIndex={disabled ? undefined : 0}
        title={title || undefined}
      >
        {children}
      </span>
    );
  }
}

export default PointerSurface;
