import { Extension } from '@tiptap/react';

import { buildEditorNodes } from '../Extensions/EditorNodes';
import { buildEditorPlugins } from '../Extensions/EditorPlugins';

import { buildEditorMarks } from './EditorMarks';
import { EditorExtensionsOptions } from './ExtensionsOptions';

const CustomEnterKeyBehavior = Extension.create({
  name: 'customEnterKeyBehavior',

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => {
        // prevent conflict with global send hot key
        return true;
      }
    };
  }
});
export const buildEditorExtensions = (options?: EditorExtensionsOptions) => [
  ...buildEditorNodes(options),
  ...buildEditorMarks(options),
  ...buildEditorPlugins(options),
  CustomEnterKeyBehavior
];

export * from './ExtensionsOptions';
export { buildEditorMarks, buildEditorPlugins, buildEditorNodes };
