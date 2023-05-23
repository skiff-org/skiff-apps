import { Fragment, Node, NodeType } from 'prosemirror-model';
import { Transaction } from 'prosemirror-state';

import { LIST_ITEM, LIST_TASK_ITEM, PARAGRAPH, TODO_LIST, TOGGLE_LIST } from './NodeNames';
import { createToggleItemFromParagraph, createToggleItemWithText } from './toggleList/utils';

interface FragmentWithContent extends Fragment {
  content: Node[];
}

export const parseTodoList = (tr: Transaction, newListType: NodeType, pos: number, originalList: Node) => {
  // TODO: figure out why Fragment type don't have content property
  const listItems = (originalList.content as FragmentWithContent).content.map((task: Node) => {
    const newItem = newListType.schema.nodes[newListType.name === TODO_LIST ? LIST_TASK_ITEM : LIST_ITEM].createAndFill(
      task.attrs,
      // task item can have only one paragraph as child
      task.firstChild
    );
    return newItem;
  });
  const newList = newListType.createAndFill(originalList.attrs, listItems);

  if (newList) {
    tr.replaceRangeWith(pos, pos + originalList.nodeSize, newList);
  }

  return tr;
};

export const parseToggleLIst = (tr: Transaction, newListType: NodeType, pos: number, originalList: Node) => {
  const listItems = (originalList.content as FragmentWithContent).content.map((oldItem: Node) => {
    if (newListType.name === TOGGLE_LIST) {
      if (oldItem.firstChild?.type.name === PARAGRAPH)
        return createToggleItemFromParagraph(tr.doc.type.schema, oldItem.firstChild);
      return createToggleItemWithText(tr.doc.type.schema, oldItem.textContent);
    } else {
      const newItem = newListType.schema.nodes[
        newListType.name === TODO_LIST ? LIST_TASK_ITEM : LIST_ITEM
      ].createAndFill(oldItem.attrs, oldItem.firstChild?.firstChild);
      return newItem;
    }
  });
  const newList = newListType.createAndFill(originalList.attrs, listItems);

  if (newList) {
    tr.replaceRangeWith(pos, pos + originalList.nodeSize, newList);
  }

  return tr;
};
