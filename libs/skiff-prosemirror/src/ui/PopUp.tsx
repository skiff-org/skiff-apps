import React from 'react';
import { Subtract } from 'utility-types';

import { InjectedPopUpProps } from './createPopUp';
import type { PopUpDetails } from './PopUpManager';
import PopUpManager, { PopUpBridge } from './PopUpManager';
import { atAnchorBottomLeft, atViewportCenter } from './PopUpPosition';
import type { Rect } from './rects';
import uuid from './uuid';

type PositionHandler = (anchorRect?: Rect | null, bodyRect?: Rect | null) => Rect;
export type PopUpParams = {
  anchor?: any;
  autoDismiss?: boolean | null;
  container?: Element | null;
  modal?: boolean | null;
  onClose?: ((val: any) => void) | null;
  position?: PositionHandler | null;
  closeOnClick?: boolean;
};

export type PopUpHandle<T extends InjectedPopUpProps> = {
  close: (val?: any) => any;
  update: (props: Subtract<T, InjectedPopUpProps>, overridePopupParams?: PopUpParams) => void;
};

class PopUp<T extends InjectedPopUpProps> extends React.PureComponent<{
  View: React.ComponentType<T>;
  close: (...args: Array<any>) => any;
  popUpParams: PopUpParams;
  viewProps: Omit<T, 'close'>;
}> {
  componentDidMount(): void {
    this._bridge = {
      getDetails: this._getDetails
    };
    PopUpManager.register(this._bridge);
  }

  componentWillUnmount(): void {
    if (this._bridge) PopUpManager.unregister(this._bridge);
  }

  _bridge: PopUpBridge | null = null;

  _id = uuid();

  _getDetails = (): PopUpDetails => {
    const { close, popUpParams } = this.props;
    const { anchor, autoDismiss, position, modal, closeOnClick } = popUpParams;
    return {
      anchor,
      autoDismiss: autoDismiss !== false,
      body: document.getElementById(this._id),
      close,
      modal: modal === true,
      closeOnClick,
      position: position || (modal ? atViewportCenter : atAnchorBottomLeft)
    };
  };

  render() {
    const { View, viewProps, close } = this.props;
    return (
      <div data-pop-up-id={this._id} id={this._id}>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <View {...(viewProps as T)} close={close} />
      </div>
    );
  }
}

export default PopUp;
