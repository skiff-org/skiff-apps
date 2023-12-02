import { Editor } from '@tiptap/react';
import { Icon } from 'nightwatch-ui';

import { isLinkEnabled, toggleLink } from '../../mailEditorUtils';

import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysFalse } from './utils';

export const toggleLinkPopup: ToolBarCommand = {
  icon: Icon.Link,
  command: (editor: Editor) => {
    toggleLink(editor);
  },
  enabled: (editor: Editor) => isLinkEnabled(editor),
  label: 'Insert link',
  active: alwaysFalse
};

export const toggleLinkCommandGroup: ToolBarCommandGroup = {
  commands: [toggleLinkPopup],
  type: ToolBarCommandGroupTypes.Normal
};
