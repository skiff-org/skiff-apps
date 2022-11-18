import { ThemeName } from 'skiff-front-utils';

import { ClickOnHandler, PasteHandler } from '../Plugins/PastePlugin';

export interface EditorExtensionsOptions {
  /**
   * disables the Show / Hide bar on mail blockquote
   * if true they are always open
   */
  disableBlockquoteToggle?: boolean;
  /**
   * editor theme
   */
  theme?: ThemeName;
  /**
   * An array of the thread senders
   */
  threadSenders?: string[];
  /**
   * external paste handlers
   */
  pasteHandlers?: PasteHandler[];
  /**
   * external click handlers
   */
  clickOnHandlers?: ClickOnHandler[];
  /**
   * Include mobile app plugins or not
   */
  isMobileApp?: boolean;
}
