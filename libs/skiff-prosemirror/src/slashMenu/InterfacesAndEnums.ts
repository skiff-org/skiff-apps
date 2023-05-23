import { PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export const SearchPlaceHolder = 'Search...';
export const SLASH_MENU_ID = 'slash-menu-div';

export enum SubMenuTypes {
  MAIN_MENU = 'mainMenu',
  HEADING_MENU = 'headingMenu',
  FONT_TYPE_MENU = 'fontTypeMenu',
  HIGHLIGHT_MENU = 'highlightMenu',
  TEXT_COLOR_MENU = 'textColorMenu',
  NO_MATCH_MENU = 'noMatchMenu'
}

export enum MenuItemNamesIds {
  HEADING = 'item-heading',
  LATEX = 'item-latex',
  OL = 'item-ol',
  UL = 'item-ul',
  INSERT_TABLE = 'insert-table',
  CODE_BLOCK = 'code-block',
  TODO = 'item-todo',
  SUB_PAGE = 'item-subpage',
  BOLD = 'item-bold',
  ITALIC = 'item-italic',
  HR = 'item-horizontal-rule',
  COLOR_TEXT = 'item-text-color',
  COLOR_HIGHLIGHT = 'item-highlight-color',
  FONT_TYPE = 'item-font-type',
  TOGGLE_LIST = 'toggle-list',
  IMAGE = 'item-image'
}

export enum HeadingIds {
  H1 = 'item-h1',
  H2 = 'item-h2',
  H3 = 'item-h3',
  H4 = 'item-h4',
  H5 = 'item-h5',
  H6 = 'item-h6'
}

/**
 * interface for a slash menu item
 * @interface
 */
export interface MenuItem {
  id: string;
  label: string;
  command: (view: EditorView) => void;
  icon?: React.ReactElement<any>;
  fontName?: string;
}

/**
 * Types of commands slashMenu plugin can receive
 */
export enum MetaTypes {
  open = 'open',
  close = 'close',
  openSubMenu = 'openSubMenu',
  closeSubMenu = 'closeSubMenu',
  stepUp = 'stepUp',
  stepDown = 'stepDown',
  inputChange = 'inputChange',
  invisible = 'invisible'
}

export const slashMenuKey = new PluginKey<SlashMenuState>('slashMenu');

/**
 * interface for the properties of the SlashMenu
 * @interface
 */
export interface SlashMenuState {
  mainMenuItems: Array<MenuItem>;
  headerItems: Array<MenuItem>;
  textColorItems: Array<MenuItem>;
  highLightColorItems: Array<MenuItem>;
  fontTypeItems: Array<MenuItem>;
  noMatchItems: Array<MenuItem>;
  open: boolean;
  openedMenuType: SubMenuTypes;
  areThereOptions: boolean;
  position: number;
  selectedOption: number;
  filter: string;
}
/**
 * Interface for the returned object from the autoCompleteFilter function
 * @interface
 */
export interface FilteredMenuItems {
  mainMenuItems: Array<MenuItem>;
  headerItems: Array<MenuItem>;
  textColorItems: Array<MenuItem>;
  highlightColorItems: Array<MenuItem>;
  fontTypeItems: Array<MenuItem>;
}
