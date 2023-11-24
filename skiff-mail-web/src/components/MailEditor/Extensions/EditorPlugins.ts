import Dropcursor from '@tiptap/extension-dropcursor';
import History from '@tiptap/extension-history';

import { Placeholder } from '../Placeholder';
import { DoubleSpacePeriodPlugin, MessageSizeExtension, PastePlugin, UuidPlugin } from '../Plugins';

import { EditorExtensionsOptions } from './ExtensionsOptions';
import { CreatePopupPlugin } from './PopupPlugin';

export const buildEditorPlugins = (options?: EditorExtensionsOptions) => {
  const mobileAppPlugins = [DoubleSpacePeriodPlugin];
  const basePlugins = [
    History,
    CreatePopupPlugin,
    Placeholder,
    Dropcursor,
    PastePlugin(options?.pasteHandlers || [], options?.clickOnHandlers || []),
    MessageSizeExtension,
    UuidPlugin
  ];

  return options?.isMobileApp ? [...basePlugins, ...mobileAppPlugins] : basePlugins;
};
