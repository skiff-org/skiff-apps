import { EditorView } from 'prosemirror-view';
import { useCallback, useState } from 'react';

import { CommentDraft, commentPluginKey } from '../comment.types';
import { schema } from '../CommentEditorSchema';
import { clearCommentDraft, updateCommentDraft } from '../utils/thread';

const useDraft = (view: EditorView) => {
  const [draft, setDraft] = useState<CommentDraft | null>(commentPluginKey.getState(view.state)?.draft || null);

  const clearDraft = useCallback(() => {
    setDraft(null);
    clearCommentDraft(view);
  }, [view]);

  const updateDraft = useCallback(
    (draftPayload: CommentDraft) => {
      if (schema.nodeFromJSON(draftPayload.content).nodeSize <= 4) return clearDraft();
      updateCommentDraft(view, draftPayload.content, draftPayload.threadId, draftPayload.commentId);
      setDraft(draftPayload);
    },
    [clearDraft, view]
  );

  return { draft, updateDraft, clearDraft };
};
export default useDraft;
