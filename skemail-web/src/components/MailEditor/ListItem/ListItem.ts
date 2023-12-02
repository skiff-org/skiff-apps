import { mergeAttributes } from '@tiptap/core';
import { ListItem } from '@tiptap/extension-list-item';
import { findParentNode } from 'prosemirror-utils';

import { listItemStyling } from '../nodeStyles';

import { listItemJoinBackward } from './listItemJoinBackward';
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    listItem: {
      listItemJoinBackward: () => ReturnType;
      listItemBackspace: () => ReturnType;
    };
  }
}

export default ListItem.extend({
  addCommands() {
    return {
      listItemJoinBackward,
      listItemBackspace:
        () =>
        ({ commands, state }) => {
          const isAtStart = state.selection.$from.parentOffset === 0;
          const node = findParentNode((node) => node.type.name === ListItem.name)(state.selection);
          if (!isAtStart) return false;
          if (!node) {
            // If the current node is not a ListItem try join it with the prev node
            return commands.listItemJoinBackward();
          }
          // If the node is a ListItem and the selection is at the start of the node
          // lift the node to remove indentation
          return commands.liftListItem(ListItem.name);
        }
    };
  },
  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
      Backspace: () => this.editor.commands.listItemBackspace()
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['li', mergeAttributes(HTMLAttributes, { style: listItemStyling }), 0];
  }
});
