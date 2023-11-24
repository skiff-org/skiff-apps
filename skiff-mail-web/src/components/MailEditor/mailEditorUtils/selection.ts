import { Editor } from '@tiptap/core';

import findNodesWithSameMark from './findNodesWithSameMark';

enum NodeName {
  P = 'P',
  A = 'A',
  Div = 'div',
  Text = '#text'
}
const elementIsOfType = (element: Element, name: NodeName) => {
  return element.nodeName && element.nodeName === name;
};

export const isSelectionNotEmpty = (editor: Editor) =>
  editor && editor.view.state.selection.from !== editor.view.state.selection.to;

export const getElementOnSelection = (editor: Editor) => {
  // Get element at selection pos
  let elementOnSelection = editor.view.domAtPos(editor.state.selection.to).node as Element;
  const res =
    findNodesWithSameMark(
      editor.state.doc,
      editor.state.selection.from,
      editor.state.selection.to,
      editor.schema.marks.link
    ) ||
    findNodesWithSameMark(
      editor.state.doc,
      editor.state.selection.from - 1,
      editor.state.selection.to - 1,
      editor.schema.marks.link
    );

  // If the selection is empty or the current element on selection is a text node
  // and the element on selection is not a paragraph
  // set the elementOnSelection to its parent
  if (
    (!isSelectionNotEmpty(editor) || elementIsOfType(elementOnSelection, NodeName.Text)) &&
    !elementIsOfType(elementOnSelection, NodeName.P) &&
    elementOnSelection.parentElement
  ) {
    elementOnSelection = elementOnSelection.parentElement;
  }
  // If the element on selection is a paragraph and it has no other children
  // try and set it's anchor child (if it has one) to the element on selection
  if (res && elementIsOfType(elementOnSelection, NodeName.P)) {
    const anchorChild = elementOnSelection.querySelector('a');
    if (anchorChild) {
      elementOnSelection = anchorChild;
    }
  }
  return elementOnSelection;
};
