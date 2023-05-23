import { EditorView } from 'prosemirror-view';

import { activeThreadKey } from '../comments/comment.types';
import { getScrolledEditor } from '../comments/utils/FloatingThreads';
import { findThreadNodes } from '../comments/utils/thread';
import { MARK_COMMENT } from '../MarkNames';
import { DeepLinkMeta } from '../skiffEditorCustomStatePlugin';
import { AnchorTypes } from '../utils/deeplink';

const handleComment = (view: EditorView, deeplink: DeepLinkMeta) => {
  const editorScrollEl = getScrolledEditor();
  const threadNodes = findThreadNodes(view.state.doc, view.state.schema.marks[MARK_COMMENT], deeplink.id);
  // Scroll the editor to the comment
  if (editorScrollEl) {
    const { top: commentAnchorTop } = view.coordsAtPos(threadNodes[0].pos);
    editorScrollEl.scrollBy({ top: commentAnchorTop - 200, behavior: 'auto' });
  }
  // Activate the thread
  const { tr } = view.state;
  tr.setMeta(activeThreadKey, {
    id: [deeplink.id],
    from: threadNodes[0].pos,
    to: threadNodes[threadNodes.length - 1].pos + threadNodes[threadNodes.length - 1].node.nodeSize
  });
  view.dispatch(tr);
};

const handleMention = (deeplink: DeepLinkMeta) => {
  const editorScrollEl = getScrolledEditor();
  const mentionNode = document.getElementById(deeplink.id);
  if (!mentionNode) return;
  // Scroll the editor to the comment
  if (editorScrollEl) {
    const { top: mentionAnchorTop } = mentionNode.getBoundingClientRect();
    editorScrollEl.scrollBy({ top: mentionAnchorTop - 200, behavior: 'auto' });
  }
};

export const handleDeepLink = (view: EditorView, deeplink: DeepLinkMeta) => {
  switch (deeplink.type) {
    case AnchorTypes.Comment:
      // Deeplink to comment
      handleComment(view, deeplink);
      break;
    case AnchorTypes.Mention:
      // Deeplink to mention
      handleMention(deeplink);
      break;
  }
};
