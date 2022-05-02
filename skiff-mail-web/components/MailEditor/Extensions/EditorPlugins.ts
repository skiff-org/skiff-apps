import Dropcursor from '@tiptap/extension-dropcursor';
import History from '@tiptap/extension-history';

import { LinkCreatePopupPlugin } from '../Link';
import { Placeholder } from '../Placeholder';
import { MessageSizeExtension, PastePlugin } from '../Plugins';
import { EditorExtensionsOptions } from './ExtensionsOptions';

export const buildEditorPlugins = (options?: EditorExtensionsOptions) => [
  History,
  LinkCreatePopupPlugin,
  Placeholder,
  Dropcursor,
  PastePlugin(options?.pasteHandlers || []),
  MessageSizeExtension
];
