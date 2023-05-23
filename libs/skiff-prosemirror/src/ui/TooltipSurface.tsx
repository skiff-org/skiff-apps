// eslint-disable-next-line max-classes-per-file
import './skiff-tooltip-surface.css';
import './skiff-animations.css';

import React, { ComponentProps } from 'react';

import createPopUp, { InjectedPopUpProps } from './createPopUp';
import { PopUpHandle } from './PopUp';
import { atAnchorBottomCenter } from './PopUpPosition';
import uuid from './uuid';

const TooltipView: React.FunctionComponent<{ tooltip: string } & InjectedPopUpProps> = (props) => {
  const { tooltip } = props;
  return <div className='skiff-tooltip-view skiff-animation-fade-in'>{tooltip}</div>;
};

class TooltipSurface extends React.PureComponent<{
  tooltip: string;
  children?: any;
}> {
  componentWillUnmount(): void {
    this._popUp?.close();
  }

  _id = uuid();

  _popUp: PopUpHandle<ComponentProps<typeof TooltipView>> | null = null;

  _onMouseEnter = (): void => {
    if (!this._popUp) {
      const { tooltip } = this.props;
      this._popUp = createPopUp(
        TooltipView,
        {
          tooltip
        },
        {
          anchor: document.getElementById(this._id),
          onClose: this._onClose,
          position: atAnchorBottomCenter
        }
      );
    }
  };

  _onMouseLeave = (): void => {
    this._popUp?.close();
    this._popUp = null;
  };

  _onClose = (): void => {
    this._popUp = null;
  };

  render() {
    const { tooltip, children } = this.props;
    return (
      <span
        aria-label={tooltip}
        className='skiff-tooltip-surface'
        data-tooltip={tooltip}
        id={this._id}
        onMouseDown={tooltip ? this._onMouseLeave : undefined}
        onMouseEnter={tooltip ? this._onMouseEnter : undefined}
        onMouseLeave={tooltip ? this._onMouseLeave : undefined}
        role='tooltip'
      >
        {children}
      </span>
    );
  }
}

export default TooltipSurface;
