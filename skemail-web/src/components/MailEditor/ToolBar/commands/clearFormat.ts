import { Editor } from '@tiptap/react';
import { Icon } from 'nightwatch-ui';

import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysFalse } from './utils';

export const clearFormatPopup: ToolBarCommand = {
  icon: Icon.ClearFormatting,
  command: (editor: Editor) => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
  },
  enabled: (editor: Editor) => !!editor,
  label: 'Clear formatting',
  active: alwaysFalse
};

export const clearFormatCommandGroup: ToolBarCommandGroup = {
  commands: [clearFormatPopup],
  type: ToolBarCommandGroupTypes.Normal
};
