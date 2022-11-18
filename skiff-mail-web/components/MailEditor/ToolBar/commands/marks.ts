import { Icon } from 'nightwatch-ui';

import { Bold, Italic, Strike, Underline } from '../../Extensions/EditorMarks';
import { BulletList, OrderedList } from '../../Extensions/EditorNodes';

import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysTrue } from './utils';

export const marksCommandsLabels = {
  bold: 'Bold',
  italic: 'Italic',
  underline: 'Underline',
  strike: 'Strikethrough',
  bulletedList: 'Bulleted list',
  numberedList: 'Numbered list'
};

export const bold: ToolBarCommand = {
  icon: Icon.Bold,
  command: (editor) => {
    editor.chain().focus().toggleBold().run();
  },
  enabled: alwaysTrue,
  label: marksCommandsLabels.bold,
  active: (editor) => editor && editor.isActive(Bold.name)
};

export const italic: ToolBarCommand = {
  icon: Icon.Italic,
  command: (editor) => {
    editor.chain().focus().toggleItalic().run();
  },
  enabled: alwaysTrue,
  label: marksCommandsLabels.italic,
  active: (editor) => editor && editor.isActive(Italic.name)
};

export const underline: ToolBarCommand = {
  icon: Icon.Underline,
  command: (editor) => {
    editor.chain().focus().toggleUnderline().run();
  },
  enabled: alwaysTrue,
  label: marksCommandsLabels.underline,
  active: (editor) => editor && editor.isActive(Underline.name)
};

export const strike: ToolBarCommand = {
  icon: Icon.Strikethrough,
  command: (editor) => {
    editor.chain().focus().toggleStrike().run();
  },
  enabled: alwaysTrue,
  label: marksCommandsLabels.strike,
  active: (editor) => editor && editor.isActive(Strike.name)
};

export const bulletedList: ToolBarCommand = {
  icon: Icon.BulletList,
  command: (editor) => {
    editor.chain().focus().toggleBulletList().run();
  },
  enabled: (editor) => editor && editor.can().toggleBulletList(),
  label: marksCommandsLabels.bulletedList,
  active: (editor) => editor && editor.isActive(BulletList.name)
};

export const numberedList: ToolBarCommand = {
  icon: Icon.NumberList,
  command: (editor) => {
    editor.chain().focus().toggleOrderedList().run();
  },
  enabled: (editor) => editor && editor.can().toggleOrderedList(),
  label: marksCommandsLabels.numberedList,
  active: (editor) => editor && editor.isActive(OrderedList.name)
};

export const allMarkCommandsGroup: ToolBarCommandGroup = {
  commands: [bold, italic, underline, strike, bulletedList, numberedList],
  type: ToolBarCommandGroupTypes.Normal
};
