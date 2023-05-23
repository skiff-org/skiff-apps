/**
 * Returns a custom handle paste function to overwrite ProseMirrors default behaviour
 */
import { isInTable } from '@skiff-org/prosemirror-tables';
import { Fragment, Node, Schema, Slice } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { findParentNodeOfType, findParentNodeOfTypeClosestToPos } from 'prosemirror-utils';
import { EditorView } from 'prosemirror-view';
import isURL from 'validator/lib/isURL';

import EditorSchema from '../EditorSchema';
import { isSelectionInNonLinkableNodes } from '../inputRules/linkRules';
import { MARK_EM, MARK_LINK, MARK_STRIKE, MARK_STRONG, MARK_TEXT_COLOR, MARK_UNDERLINE } from '../MarkNames';
import { BULLET_LIST, LIST_ITEM, ORDERED_LIST, PARAGRAPH, TODO_LIST } from '../NodeNames';
import sanitizeURL from '../sanitizeURL';
import { wrapNodesWithList } from '../toggleList';
import CustomEditorView from '../ui/CustomEditorView';
import uuid from '../ui/uuid';

const NOTION_PASTE_DATA = 'text/_notion-blocks-v3-production';
// List of mark names that we allow to be copy pasted into skiff or within skiff
const ALLOWED_MARKS = new Set<string>([MARK_EM, MARK_STRONG, MARK_UNDERLINE, MARK_LINK, MARK_STRIKE, MARK_TEXT_COLOR]);

function sliceSingleNode(slice: Slice) {
  return slice.openStart === 0 && slice.openEnd === 0 && slice.content.childCount === 1
    ? slice.content.firstChild
    : null;
}

/**
 * Detects if the selection is in a list
 */
const isInList = (state: EditorState, schema: Schema) => {
  const pos = state.selection.from;
  return (
    !!findParentNodeOfTypeClosestToPos(state.doc.resolve(pos), schema.nodes[ORDERED_LIST]) ||
    !!findParentNodeOfTypeClosestToPos(state.doc.resolve(pos), schema.nodes[BULLET_LIST])
  );
};
/**
 * When only paragraphs are pasted from the clipboard and the selection is in a list <ul> or <ol>, we transform the copied slice so every paragraph is in a new list item.
 */
const transformSliceToList = (slice: Slice, view: EditorView, fragments: Array<Node>, schema: Schema) => {
  const newFragments = fragments.map((contentNode: Node) => schema.nodes[LIST_ITEM].create(null, contentNode));
  const singleFragment = Fragment.fromArray(newFragments);
  const insertDepth = view.state.doc.resolve(view.state.selection.from).depth - 1;
  return new Slice(singleFragment, insertDepth, insertDepth);
};

// Returns the content of a fragment in a node array, replaces 'fragment.content' which throws TS error
const getFragmentContent = (fragment: Fragment) => {
  const { childCount } = fragment;
  const arr: Array<Node> = [];
  for (let i = 0; i < childCount; i += 1) {
    arr.push(fragment.child(i));
  }
  return arr;
};

const handlePasteFromNotion = (pasteData: string) => {
  // notion metadata
};

const handlePaste = (view: CustomEditorView, event: ClipboardEvent, slice: Slice) => {
  const { state } = view;
  const { selection } = state;
  const { from, to } = selection;

  const notionPasteData = event.clipboardData?.getData(NOTION_PASTE_DATA);
  if (notionPasteData) handlePasteFromNotion(JSON.parse(notionPasteData));

  if (
    EditorSchema.marks.link &&
    event.clipboardData &&
    isURL(event.clipboardData.getData('Text')) &&
    from !== to &&
    !isSelectionInNonLinkableNodes(view.state.selection)
  ) {
    view.dispatch(
      state.tr.addMark(
        state.tr.mapping.map(from),
        state.tr.mapping.map(to),
        state.schema.marks.link.create({
          href: sanitizeURL(event.clipboardData.getData('Text')),
          id: uuid()
        })
      )
    );
    return true;
  }

  // let tables plugin to handle paste inside table to properly handle cells paste
  if (isInTable(state)) return false;

  const fragmentContent: Array<Node> = getFragmentContent(slice.content);
  const onlyParagraphs = !fragmentContent.map((node) => node.type === EditorSchema.nodes[PARAGRAPH]).includes(false);
  let tr = state.tr;
  const transformedSlice: Slice =
    isInList(state, EditorSchema) && onlyParagraphs
      ? transformSliceToList(slice, view, fragmentContent, EditorSchema)
      : slice;
  const singleNode = sliceSingleNode(transformedSlice);
  const inParagraph = findParentNodeOfType(EditorSchema.nodes[PARAGRAPH])(state.selection);
  // if we want to paste listnodes but selection is in a paragraph, proseMirror will paste the first list node as a paragraph,
  // in this case we automatically wrap the selection into a list before pasting
  if (
    inParagraph &&
    fragmentContent &&
    (fragmentContent[0].type === EditorSchema.nodes[ORDERED_LIST] ||
      fragmentContent[0].type === EditorSchema.nodes[BULLET_LIST] ||
      fragmentContent[0].type === EditorSchema.nodes[TODO_LIST])
  ) {
    tr = wrapNodesWithList(tr, EditorSchema, fragmentContent[0].type, selection);
  }
  tr = singleNode
    ? // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      tr.replaceSelectionWith(singleNode, view.shiftKey)
    : tr.replaceSelection(transformedSlice);
  // After pasting in the content, we remove all marks from so it does not preserve its styling
  const contentSize = singleNode ? singleNode.content.size : transformedSlice.content.size;

  const marksToBeRemoved = Object.keys(EditorSchema.marks).filter((markName) => !ALLOWED_MARKS.has(markName));
  // Removing marks that we do not allow to be pasted in skiff
  marksToBeRemoved.forEach((markName) =>
    tr.removeMark(tr.selection.from - contentSize, tr.selection.from, EditorSchema.marks[markName])
  );
  view.dispatch(tr.scrollIntoView().setMeta('paste', true).setMeta('uiEvent', 'paste'));
  return true;
};
export default handlePaste;
