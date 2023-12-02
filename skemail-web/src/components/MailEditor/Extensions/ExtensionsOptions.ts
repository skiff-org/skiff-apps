import { ThemeMode } from 'nightwatch-ui';

import { ClickOnHandler, PasteHandler } from '../Plugins/PastePlugin';

export interface EditorExtensionsOptions {
  /**
   * If signature editor, exclude some marks/nodes (ex. image, bullets).
   */
  isMailSettingEditor?: boolean;
  /**
   * disables the Show / Hide bar on mail blockquote
   * if true they are always open
   */
  disableBlockquoteToggle?: boolean;
  /**
   * editor theme
   */
  theme?: ThemeMode;
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
