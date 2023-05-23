/* eslint-disable @typescript-eslint/no-unused-expressions */
import clamp from './clamp';
import type { PositionHandler } from './PopUpPosition';
import type { Rect } from './rects';
import { fromHTMlElement, fromXY, isIntersected } from './rects';

export type PopUpDetails = {
  anchor?: HTMLElement | null;
  anchorRect?: Rect | null;
  autoDismiss: boolean;
  body?: HTMLElement | null;
  bodyRect?: Rect | null;
  close: (val: any) => void;
  modal: boolean;
  closeOnClick?: boolean;
  position: PositionHandler;
};
export type PopUpBridge = {
  getDetails: () => PopUpDetails;
};
const CLICK_INTERVAL = 350;
const DUMMY_RECT = {
  x: -10000,
  y: -10000,
  w: 0,
  h: 0
};

class PopUpManager {
  _bridges = new Map();

  _positions = new Map();

  _mx = 0;

  _my = 0;

  _rafID = 0;

  register(bridge: PopUpBridge): void {
    this._bridges.set(bridge, Date.now());

    this._positions.set(bridge, null);
    if (this._bridges.size === 1) {
      this._observe();
    }

    this._rafID = requestAnimationFrame(this._syncPosition);
  }

  unregister(bridge: PopUpBridge): void {
    this._bridges.delete(bridge);

    this._positions.delete(bridge);

    if (this._bridges.size === 0) {
      this._unobserve();
    }

    this._rafID && cancelAnimationFrame(this._rafID);
  }

  _observe(): void {
    document.addEventListener('mousemove', this._onMouseChange, false);
    document.addEventListener('mouseup', this._onMouseChange, false);
    document.addEventListener('click', this._onClick, false);
    window.addEventListener('scroll', this._onScroll, true);
    window.addEventListener('resize', this._onResize, true);
  }

  _unobserve(): void {
    document.removeEventListener('mousemove', this._onMouseChange, false);
    document.removeEventListener('mouseup', this._onMouseChange, false);
    document.removeEventListener('click', this._onClick, false);
    window.removeEventListener('scroll', this._onScroll, true);
    window.removeEventListener('resize', this._onResize, true);
    this._rafID && cancelAnimationFrame(this._rafID);
  }

  _onScroll = (): void => {
    this._rafID && cancelAnimationFrame(this._rafID);
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onResize = (): void => {
    this._rafID && cancelAnimationFrame(this._rafID);
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onMouseChange = (e: MouseEvent): void => {
    this._mx = Math.round(e.clientX);
    this._my = Math.round(e.clientY);
    this._rafID && cancelAnimationFrame(this._rafID);
    this._rafID = requestAnimationFrame(this._syncPosition);
  };

  _onClick = (e: MouseEvent): void => {
    const now = Date.now();
    let detailsWithModalToDismiss;

    for (const [bridge, registeredAt] of this._bridges) {
      if (now - registeredAt > CLICK_INTERVAL) {
        const details = bridge.getDetails();

        if ((details.modal && details.autoDismiss) || details.closeOnClick) {
          detailsWithModalToDismiss = details;
        }
      }
    }

    if (!detailsWithModalToDismiss) {
      return;
    }

    const { body, close } = detailsWithModalToDismiss;
    const pointer = fromXY(e.clientX, e.clientY, 1);
    const bodyRect = body ? fromHTMlElement(body) : null;

    if (!bodyRect || !isIntersected(pointer, bodyRect)) {
      close();
    }
  };

  _syncPosition = (): void => {
    this._rafID = 0;
    const bridgeToDetails = new Map();

    for (const [
      bridge // eslint-disable-next-line no-unused-vars
    ] of this._bridges) {
      const details = bridge.getDetails();
      bridgeToDetails.set(bridge, details);
      const { anchor, body } = details;

      if (body instanceof HTMLElement) {
        details.bodyRect = fromHTMlElement(body);
      }

      if (anchor instanceof HTMLElement) {
        details.anchorRect = fromHTMlElement(anchor);
      }
    }

    const pointer = fromXY(this._mx, this._my, 2);
    const hoveredAnchors = new Set();

    for (const [bridge, details] of bridgeToDetails) {
      const { anchor, bodyRect, anchorRect, position, body } = details;

      if (!bodyRect && !anchorRect) {
        continue;
      }

      const { x, y } = position(anchorRect, bodyRect);
      const positionKey = `${x}-${y}`;

      if (body && bodyRect && this._positions.get(bridge) !== positionKey) {
        const ax = anchorRect ? clamp(0, anchorRect.x - x + anchorRect.w / 2, bodyRect.w - anchorRect.w / 2) : 0;

        this._positions.set(bridge, positionKey);

        const bodyStyle = body.style;
        bodyStyle.position = 'absolute';
        bodyStyle.left = `${x}px`;
        bodyStyle.top = `${y}px`;
        bodyStyle.setProperty('--skiff-pop-up-anchor-offset-left', `${ax}px`);
        bodyRect.x = x;
        bodyRect.y = y;
      }

      if (isIntersected(pointer, bodyRect || DUMMY_RECT, 0) || isIntersected(pointer, anchorRect || DUMMY_RECT, 0)) {
        if (anchor) {
          hoveredAnchors.add(anchor);
        }
      }
    }

    while (true) {
      const { size } = hoveredAnchors;

      for (const [details] of bridgeToDetails) {
        const { anchor, body } = details;

        for (const ha of hoveredAnchors) {
          if (anchor && body && !hoveredAnchors.has(anchor) && body.contains(ha)) {
            hoveredAnchors.add(anchor);
          }
        }
      }

      if (hoveredAnchors.size === size) {
        break;
      }
    }

    const now = Date.now();

    for (const [bridge, registeredAt] of this._bridges) {
      const details = bridgeToDetails.get(bridge);

      if (details) {
        const { autoDismiss, anchor, close, modal } = details;

        if (
          autoDismiss && // Modal is handled separately at `onClick`
          !modal &&
          now - registeredAt > CLICK_INTERVAL &&
          !hoveredAnchors.has(anchor)
        ) {
          close();
        }
      }
    }
  };
}

const instance = new PopUpManager();
export default instance;
