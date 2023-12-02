import React from 'react';

export enum ClickType {
  Left,
  Middle,
  Right,
  Meta,
  Ctrl
}

export const getClickType = (evt: React.MouseEvent | MouseEvent) => {
  // Treat any other click type as a regular click
  let clickType = ClickType.Left;
  switch (true) {
    // Middle and right take priority so something like meta + right doesn't get treated as meta + left
    case evt.button === 1:
      clickType = ClickType.Middle;
      break;
    case evt.button === 2:
      clickType = ClickType.Right;
      break;
    case evt.metaKey:
      clickType = ClickType.Meta;
      break;
    case evt.ctrlKey:
      clickType = ClickType.Ctrl;
      break;
  }
  return clickType;
};

export const eventOfClickType = (evt: React.MouseEvent | MouseEvent, clickTypes: ClickType[]) => {
  const clickType = getClickType(evt);
  return clickTypes.includes(clickType);
};
