import './skiff-vars.css';
import './skiff-pop-up.css';

import React from 'react';
import ReactDOM from 'react-dom';
import { Subtract } from 'utility-types';

import type { PopUpHandle, PopUpParams } from './PopUp';
import PopUp from './PopUp';
import uuid from './uuid';

let modalsCount = 0;
let popUpsCount = 0;
const Z_INDEX_BASE = 100;
const MODAL_MASK_ID = `pop-up-modal-mask-${uuid()}`;

function showModalMask(): void {
  const root: any = document.body || document.documentElement;
  let element = document.getElementById(MODAL_MASK_ID);

  if (!element) {
    element = document.createElement('div');
    element.id = MODAL_MASK_ID;
    element.className = 'skiff-pop-up-modal-mask';
    element.setAttribute('data-mask-type', 'skiff-pop-up-modal-mask');
    element.setAttribute('role', 'dialog');
    element.setAttribute('aria-modal', 'true');
  }

  if (root && !element.parentElement) {
    root.appendChild(element);
  }

  const { style } = element;
  const selector = '.skiff-pop-up-element[data-pop-up-modal]';
  const zIndex = Array.from(document.querySelectorAll(selector)).reduce(
    (acc, el) => Math.max(acc, el instanceof HTMLElement ? Number(el.style.zIndex) : 0),
    0
  );
  style.zIndex = (zIndex - 1).toString();
}

function hideModalMask(): void {
  const element = document.getElementById(MODAL_MASK_ID);

  if (element && element.parentElement) {
    element.parentElement.removeChild(element);
  }
}

function getRootElement(
  id: string,
  forceCreation: boolean,
  popUpParams?: PopUpParams | null
): HTMLElement | null | undefined {
  const root: any = popUpParams && (popUpParams.container || document.body || document.documentElement);
  let element = document.getElementById(id);

  if (!element && forceCreation) {
    element = document.createElement('div');
  }

  if (!element) {
    return null;
  }

  if (popUpParams && popUpParams.modal) {
    element.setAttribute('data-pop-up-modal', 'y');
  }

  element.className = 'skiff-pop-up-element skiff-vars';
  element.id = id;
  const { style } = element;
  const modalZIndexOffset = popUpParams && popUpParams.modal ? 1 : 0;

  if (!(popUpParams && popUpParams.container)) {
    style.zIndex = (Z_INDEX_BASE + popUpsCount * 3 + modalZIndexOffset).toString();
  }

  // Populates the default ARIA attributes here.
  // http://accessibility.athena-ict.com/aria/examples/dialog.shtml
  element.setAttribute('role', 'dialog');
  element.setAttribute('aria-modal', 'true');

  if (root && !element.parentElement) {
    root.appendChild(element);
  }

  return element;
}

function renderPopUp<T extends InjectedPopUpProps>(
  rootId: string,
  close: (...args: Array<any>) => any,
  View: React.ComponentType<T>,
  viewProps: Subtract<T, InjectedPopUpProps>,
  popUpParams: PopUpParams
): void {
  const rootNode = getRootElement(rootId, true, popUpParams);

  if (rootNode) {
    const component = <PopUp View={View} close={close} popUpParams={popUpParams} viewProps={viewProps} />;
    ReactDOM.render(component, rootNode);
  }

  if (modalsCount > 0) {
    showModalMask();
  } else {
    hideModalMask();
  }
}

function unrenderPopUp(rootId: string): void {
  const rootNode = getRootElement(rootId, false);

  if (rootNode) {
    ReactDOM.unmountComponentAtNode(rootNode);
    rootNode.parentElement?.removeChild(rootNode);
  }

  if (modalsCount === 0) {
    hideModalMask();
  }
}

export interface InjectedPopUpProps {
  close: (...args: any[]) => any;
}
export default function createPopUp<T extends InjectedPopUpProps>(
  View: React.ComponentType<T>,
  viewProps: Subtract<T, InjectedPopUpProps>,
  popUpParams?: PopUpParams | null
): PopUpHandle<T> {
  const rootId = uuid();
  let handle: PopUpHandle<T> | null = null;
  let currentViewProps = viewProps;
  popUpParams = popUpParams || {};
  const modal = popUpParams.modal || !popUpParams.anchor;
  popUpParams.modal = modal;
  popUpsCount += 1;

  if (modal) {
    modalsCount += 1;
  }

  // TODO! What is value here?
  // The value should be a generic here. It is hard to type and I'm too tired for it right now. Would be useful though!
  // PopUpParams should be a generic. It has an onClose field, which is an any[] => any. any[] is the value here, it's
  // different for different popups, since many popUps transfer information trough this onClose method.
  // For ex. picked color / user, anything goes.
  const closePopUp = (value: any) => {
    console.debug('[comments] called closePopUp (createpopup.js)');

    if (!handle) {
      return;
    }

    if (modal) {
      modalsCount -= 1;
    }

    popUpsCount -= 1;
    handle = null;
    unrenderPopUp(rootId);
    popUpParams?.onClose?.(value);
  };

  const emptyObj = {};
  handle = {
    close: closePopUp,
    update: (nextViewProps: Subtract<T, InjectedPopUpProps>, overridePopupParams = {}) => {
      currentViewProps = nextViewProps;
      if (popUpParams) {
        popUpParams = { ...popUpParams, ...overridePopupParams };
      }
      renderPopUp(rootId, closePopUp, View, currentViewProps, popUpParams || emptyObj);
    }
  };
  if (currentViewProps !== null) {
    renderPopUp(rootId, closePopUp, View, currentViewProps, popUpParams || emptyObj);
  }

  return handle;
}
