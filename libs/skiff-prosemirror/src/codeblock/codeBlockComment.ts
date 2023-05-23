import { StateField, StateEffect } from '@codemirror/state';
import { EditorView, Decoration, DecorationSet } from '@codemirror/view';

import { COMMENT_MARK_ACTIVATED_CLASS, COMMENT_MARK_CLASS } from '../comments/CommentMarkSpec';

export type CodeMirrorCommentAttributes = {
  from: number;
  to: number;
  id: string;
  resolved: boolean;
};

const addComment = StateEffect.define<CodeMirrorCommentAttributes[]>();
const activateComment = StateEffect.define<Omit<CodeMirrorCommentAttributes, 'resolved'>>();
const clearMark = StateEffect.define<{ from?: number; to?: number; markClass?: string[] }>();

// This controls the state of all marks in the codemirror code block
const commentField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(commentDecorations, tr) {
    commentDecorations = commentDecorations.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(addComment)) {
        commentDecorations = commentDecorations.update({
          add: effect.value.map(({ from, to, id, resolved }) => {
            return commentMark(id, resolved).range(from, to);
          }),
          // Filter out old marks
          filter: (_from, _to, decoration) => !decoration.spec.class.split(' ').includes(COMMENT_MARK_CLASS)
        });
      } else if (effect.is(activateComment)) {
        commentDecorations = commentDecorations.update({
          add: [activatedCommentMark(effect.value.id).range(effect.value.from, effect.value.to)],
          // Filter out old marks
          filter: (_from, _to, decoration) => !decoration.spec.class.split(' ').includes(COMMENT_MARK_ACTIVATED_CLASS)
        });
      } else if (effect.is(clearMark)) {
        commentDecorations = commentDecorations.update({
          filterFrom: effect.value.from,
          filterTo: effect.value.to,
          filter: (_from, _to, decoration) => {
            // When filter returns false the mark is removed
            // If no markClass is provided, all marks in range are removed
            if (!effect.value.markClass) return false;
            if (effect.value.markClass.includes(decoration.spec.class)) {
              return false;
            }
            return true;
          }
        });
      }
    }
    return commentDecorations;
  },
  provide: (f) => EditorView.decorations.from(f)
});

const commentMark = (id: string, resolved: boolean) => {
  return Decoration.mark({ class: `${COMMENT_MARK_CLASS} ${resolved ? 'resolved' : ''}`, attributes: { id } });
};
const activatedCommentMark = (id: string) => {
  return Decoration.mark({ class: COMMENT_MARK_ACTIVATED_CLASS, attributes: { id } });
};

/**
 * Adds codemirror marks to the doc
 * @param view CodeMirror EditorView
 * @param commentAttributes Array of comment attributes
 * @returns true if successful or false if not
 */
export function markComments(view: EditorView, commentAttributes: CodeMirrorCommentAttributes[]) {
  const effects: StateEffect<any>[] = [addComment.of(commentAttributes)];
  const existingCommentField = view.state.field(commentField, false);
  // If no field exists create a new one
  if (!existingCommentField) effects.push(StateEffect.appendConfig.of([commentField]));
  view.dispatch({ effects });
  return true;
}

/**
 * Wraps the node in given range with activated comment mark decoration and then removes all other
 * activated comment marks.
 * @param view CodeMirror EditorView
 * @param from
 * @param to
 * @param id
 * @returns true if successful or false if not
 */
export function activateCommentRange(view: EditorView, from: number, to: number, id: string) {
  // Add active mark to selected comment
  // and remove all other active marks
  const effects: StateEffect<any>[] = [
    activateComment.of({ from, to, id }),
    clearMark.of({ to: from - 1, markClass: [COMMENT_MARK_ACTIVATED_CLASS] }),
    clearMark.of({ from: to + 1, markClass: [COMMENT_MARK_ACTIVATED_CLASS] })
  ];
  const existingCommentField = view.state.field(commentField, false);
  if (!existingCommentField) return false;
  view.dispatch({ effects });
  return true;
}

/**
 * Remove codemirror decoration marks in given range by class
 * @param view CodeMirror EditorView
 * @param from
 * @param to
 * @param markClass the classes of the mark to remove
 * @returns true if successful or false if not
 */
export function clearMarksAtRangeByClass(view: EditorView, markClass?: string[], from?: number, to?: number) {
  const effects: StateEffect<any>[] = [clearMark.of({ from, to, markClass })];
  const existingCommentField = view.state.field(commentField, false);
  if (!existingCommentField) return false;
  view.dispatch({ effects });
  return true;
}
