import Bold from '@tiptap/extension-bold';
import Code from '@tiptap/extension-code';
import Italic from '@tiptap/extension-italic';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import { ThemeMode } from '@skiff-org/skiff-ui';

import { TextColor, HighlightColor } from '../Color';
import { Link } from '../Link';
import { Strike } from '../Strike';

import { EditorExtensionsOptions } from './ExtensionsOptions';

export { Bold, Code, Italic, Strike, Underline, Link };

export const buildEditorMarks = (options?: EditorExtensionsOptions) => [
  Bold,
  Code,
  Italic,
  Strike,
  Underline,
  TextStyle,
  HighlightColor,
  TextColor,
  Link.configure({ theme: options?.theme || ThemeMode.LIGHT })
];
