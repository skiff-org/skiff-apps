import { buildEditorNodes } from './EditorNodes';
import { buildEditorPlugins } from './EditorPlugins';

import { buildEditorMarks } from './EditorMarks';
import { EditorExtensionsOptions } from './ExtensionsOptions';

export const buildEditorExtensions = (options?: EditorExtensionsOptions) => [
  ...buildEditorNodes(options),
  ...buildEditorMarks(options),
  ...buildEditorPlugins(options)
];

export * from './ExtensionsOptions';
export { buildEditorMarks, buildEditorPlugins, buildEditorNodes };
