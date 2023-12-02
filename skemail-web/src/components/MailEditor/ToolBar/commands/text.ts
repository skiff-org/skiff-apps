import { Editor } from '@tiptap/react';
import { Icon } from 'nightwatch-ui';

import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysTrue } from './utils';

export const textCommandsLabels = {
  alignRight: 'Align right',
  alignLeft: 'Align left',
  alignCenter: 'Align center'
};

export const alignRight: ToolBarCommand = {
  icon: Icon.AlignRight,
  command: (editor: Editor) => {
    editor.chain().focus().setTextAlign('right').run();
  },
  enabled: alwaysTrue,
  label: textCommandsLabels.alignRight,
  active: (editor: Editor) => editor && editor.isActive({ textAlign: 'right' }),
  priority: 1
};

export const alignLeft: ToolBarCommand = {
  icon: Icon.AlignLeft,
  command: (editor: Editor) => {
    editor.chain().focus().setTextAlign('left').run();
  },
  enabled: alwaysTrue,
  label: textCommandsLabels.alignLeft,
  active: (editor: Editor) => editor && editor.isActive({ textAlign: 'left' }),
  priority: 1
};

export const alignCenter: ToolBarCommand = {
  icon: Icon.AlignCenter,
  command: (editor: Editor) => {
    editor.chain().focus().setTextAlign('center').run();
  },
  enabled: alwaysTrue,
  label: textCommandsLabels.alignCenter,
  active: (editor: Editor) => editor && editor.isActive({ textAlign: 'center' }),
  priority: 1
};

export const allTextCommandsGroup: ToolBarCommandGroup = {
  commands: [alignLeft, alignCenter, alignRight],
  type: ToolBarCommandGroupTypes.DropdownIcon
};
