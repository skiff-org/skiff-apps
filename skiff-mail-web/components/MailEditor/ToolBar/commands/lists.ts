import { Icon } from '@skiff-org/skiff-ui';

import { ListItem } from '../../Extensions/EditorNodes';
import { ToolBarCommand, ToolBarCommandGroup, ToolBarCommandGroupTypes } from './types';
import { alwaysFalse } from './utils';

const listCommandsLabels = {
  increaseIndent: 'Indent',
  decreaseIndent: 'Decrease indent'
};

export const increaseIndent: ToolBarCommand = {
  icon: Icon.IncreaseIndent,
  command: (editor) => {
    editor.chain().focus().sinkListItem(ListItem.name).run();
  },
  enabled: (editor) => editor && editor.can().sinkListItem(ListItem.name),
  label: listCommandsLabels.increaseIndent,
  active: alwaysFalse
};

export const decreaseIndent: ToolBarCommand = {
  icon: Icon.DecreaseIndent,
  command: (editor) => {
    editor.chain().focus().liftListItem(ListItem.name).run();
  },
  enabled: (editor) => editor && editor.can().liftListItem(ListItem.name),
  label: listCommandsLabels.decreaseIndent,
  active: alwaysFalse
};

export const allListCommandsGroup: ToolBarCommandGroup = {
  commands: [increaseIndent, decreaseIndent],
  type: ToolBarCommandGroupTypes.Normal
};
