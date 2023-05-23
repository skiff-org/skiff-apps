import './skiff-custom-button.css';

import cx from 'classnames';
import React from 'react';

import type { PointerSurfaceProps } from './PointerSurface';
import PointerSurface from './PointerSurface';
import TooltipSurface from './TooltipSurface';

class CustomButton extends React.PureComponent<
  PointerSurfaceProps & {
    icon?: string | React.ReactElement<any> | null;
    label?: string | React.ReactElement<any> | null;
    target?: string | React.ReactElement<any> | null;
    dataTest?: string;
  }
> {
  render() {
    const { icon, label, className, title, dataTest, style, ...pointerProps } = this.props;
    const klass = cx(className, 'skiff-custom-button', {
      'use-icon': !!icon
    });
    return (
      <TooltipSurface tooltip={title || ''}>
        <PointerSurface {...pointerProps} className={klass} dataTest={dataTest} label={title} style={style}>
          {icon}
          {label}
        </PointerSurface>
      </TooltipSurface>
    );
  }
}

export default CustomButton;
