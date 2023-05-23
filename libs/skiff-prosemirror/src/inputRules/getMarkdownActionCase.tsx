import { MarkType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { TEXT } from '../NodeNames';

/**
 * Mimicking Notions' behavior if all of the text between special characters has the markType, it gets removed from all
 * if not, it gets added to the whole text
 *
 * Note: The start and end parameter is not always the same as the inputRule start and end parameter
 *
 * @param state ProseMirror state
 * @param start start position of the examined text
 * @param end end position of the examined text
 * @param markType
 */
export enum AddMarkToText {
  ADD = 'add',
  REMOVE = 'remove'
}
const getMarkdownActionCase = (state: EditorState, start: number, end: number, markType: MarkType): AddMarkToText => {
  let i = start;
  const nodes = [];
  while (i < end) {
    const node = state.doc.nodeAt(i);
    const type = node?.type;
    if (type === state.schema.nodes[TEXT]) {
      nodes.push(node);
    }
    i += 1;
  }

  const markNames = nodes.map((node) => {
    if (node !== undefined && node !== null) {
      if (node.marks.length < 1) {
        return false;
      }
      return node.marks.map((mark) => mark.type.name === markType.name).includes(true);
    }
    return false;
  });
  if (markNames.includes(false)) {
    return AddMarkToText.ADD;
  }
  return AddMarkToText.REMOVE;
};

export default getMarkdownActionCase;
