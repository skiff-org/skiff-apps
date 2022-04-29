import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';

import { Link } from '../Link';
import { EditorExtensionsOptions } from './ExtensionsOptions';

export { Bold, Code, Italic, Strike, Underline, Link };

export const buildEditorMarks = (options?: EditorExtensionsOptions) => [
  Bold,
  Code,
  Italic,
  Strike,
  Underline,
  Link.configure({ theme: options?.theme || 'light' })
];
