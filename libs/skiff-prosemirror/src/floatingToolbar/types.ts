import { ToolbarItemsIds } from './toolbarItems/itemsMap';

export enum CommandStateProperty {
  show = 'show',
  active = 'active',
  enable = 'enable'
}

export type ToolbarCommandState = { [property in CommandStateProperty]: boolean };

export type MobileToolbarState = {
  [itemId in ToolbarItemsIds]?: ToolbarCommandState;
};

export enum MobilePostMessageTypes {
  show = 'toolbarShowItem',
  enable = 'toolbarEnableItem',
  editorActiveCheck = 'editorActiveCheck'
}
