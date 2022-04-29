import { isTextSelection } from '@tiptap/core';
import { Fragment, Node, NodeType, ResolvedPos, Slice } from 'prosemirror-model';
import { NodeSelection, Selection } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';
import { canJoin, liftTarget, ReplaceAroundStep, replaceStep, Step } from 'prosemirror-transform';
import { EditorView } from 'prosemirror-view';

type Dispatch = ((args?: any) => any) | undefined;

interface JoinBackwardParams {
  state: EditorState;
  dispatch: Dispatch;
  view: EditorView;
}

interface DelStep extends Step {
  slice: Slice;
  to: number;
  from: number;
}

interface NodeTypeWithCompatibleContent extends NodeType {
  compatibleContent: (other: NodeType) => boolean;
}

/**
 * Code taken from https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js
 *
 * BlockA
 * BlockB
 * * User click presses backspace before BlockB *
 * Default behavior:
 * BlockA
 *      BlockB
 * Modified behavior:
 * BlockA BlockB
 *
 * Order of behavior has been switched to make first and second blocks content
 * merge before trying to add second block as child of first
 */
export const listItemJoinBackward =
  () =>
  ({ state, dispatch, view }: JoinBackwardParams) => {
    if (!isTextSelection(state.selection)) {
      return false;
    }
    const { $cursor } = state.selection;
    if (!$cursor || (view ? !view.endOfTextblock('backward', state) : $cursor.parentOffset > 0)) {
      return false;
    }

    const $cut = findCutBefore($cursor);

    // If there is no node before this, try to lift
    if (!$cut) {
      const range = $cursor.blockRange(),
        target = range && liftTarget(range);
      if (target == null || !range) {
        return false;
      }
      if (dispatch) {
        dispatch(state.tr.lift(range, target).scrollIntoView());
      }
      return true;
    }

    const before = $cut.nodeBefore;
    if (!before) {
      return false;
    }
    // Apply the joining algorithm
    if (!before.type.spec.isolating && deleteBarrier(state, $cut, dispatch)) {
      return true;
    }

    // If the node below has no content and the node above is
    // selectable, delete the node below and select the one above.
    if ($cursor.parent.content.size === 0 && (textblockAt(before, 'end') || NodeSelection.isSelectable(before))) {
      const delStep = replaceStep(state.doc, $cursor.before(), $cursor.after(), Slice.empty) as DelStep;
      if (!delStep) {
        return false;
      }
      if (delStep.slice.size < delStep.to - delStep.from) {
        if (dispatch) {
          const tr = state.tr.step(delStep);
          const tmpBlock = textblockAt(before, 'end')
            ? Selection.findFrom(tr.doc.resolve(tr.mapping.map($cut.pos, -1)), -1)
            : NodeSelection.create(tr.doc, $cut.pos - before.nodeSize);
          if (!tmpBlock) {
            return false;
          }
          tr.setSelection(tmpBlock);
          dispatch(tr.scrollIntoView());
        }
        return true;
      }
    }
    // If the node before is an atom, delete it
    if (before.isAtom && $cut.depth === $cursor.depth - 1) {
      if (dispatch) {
        dispatch(state.tr.delete($cut.pos - before.nodeSize, $cut.pos).scrollIntoView());
      }
      return true;
    }

    return false;
  };

function findCutBefore($pos: ResolvedPos) {
  if (!$pos.parent.type.spec.isolating) {
    for (let i = $pos.depth - 1; i >= 0; i--) {
      if ($pos.index(i) > 0) {
        return $pos.doc.resolve($pos.before(i + 1));
      }
      if ($pos.node(i).type.spec.isolating) {
        break;
      }
    }
  }
  return null;
}

function deleteBarrier(state: EditorState, $cut: ResolvedPos, dispatch: Dispatch) {
  // Delete barrier to join top
  const before = $cut.nodeBefore;
  const after = $cut.nodeAfter;
  let conn;
  let match;
  if (!before || !after) {
    return false;
  }
  if (before.type.spec.isolating || after.type.spec.isolating) {
    return false;
  }
  if (joinMaybeClear(state, $cut, dispatch)) {
    return true;
  }

  const canDelAfter = $cut.parent.canReplace($cut.index(), $cut.index() + 1);

  const selAfter = Selection.findFrom($cut, 1);
  const range = selAfter && selAfter.$from.blockRange(selAfter.$to);
  const target = range && liftTarget(range);
  if (!range) {
    return false;
  }
  if (target != null && target >= $cut.depth) {
    if (dispatch) {
      dispatch(state.tr.lift(range, target).scrollIntoView());
    }
    return true;
  }

  // Try to join content with the block that is directly before
  if (canDelAfter && textblockAt(after, 'start', true) && textblockAt(before, 'end')) {
    let at = before;
    const wrap: Array<typeof at> = [];
    for (;;) {
      wrap.push(at);
      if (at.isTextblock) {
        break;
      }
      at = at.lastChild as Node;
    }
    let afterText = after,
      afterDepth = 1;
    for (; !afterText.isTextblock; afterText = afterText.firstChild as Node) {
      afterDepth++;
    }
    if (at.canReplace(at.childCount, at.childCount, afterText.content)) {
      if (dispatch) {
        let end = Fragment.empty;
        for (let i = wrap.length - 1; i >= 0; i--) {
          end = Fragment.from(wrap[i].copy(end));
        }
        const tr = state.tr.step(
          new ReplaceAroundStep(
            $cut.pos - wrap.length,
            $cut.pos + after.nodeSize,
            $cut.pos + afterDepth,
            $cut.pos + after.nodeSize - afterDepth,
            new Slice(end, wrap.length, 0),
            0,
            true
          )
        );
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }

  // Try move the block closer to the next one in the document
  // structure by lifting it out of its parent and moving it into
  // a parent of the prev block
  if (
    canDelAfter &&
    (conn = (match = before.contentMatchAt(before.childCount)).findWrapping(after.type)) &&
    match.matchType(conn[0] || after.type)?.validEnd
  ) {
    if (dispatch) {
      const end = $cut.pos + after.nodeSize;
      let wrap = Fragment.empty;
      for (let i = conn.length - 1; i >= 0; i--) {
        wrap = Fragment.from(conn[i].create(null, wrap));
      }
      wrap = Fragment.from(before.copy(wrap));

      const tr = state.tr.step(
        new ReplaceAroundStep($cut.pos - 1, end, $cut.pos, end, new Slice(wrap, 1, 0), conn.length, true)
      );

      const joinAt = end + 2 * conn.length;
      if (canJoin(tr.doc, joinAt)) {
        tr.join(joinAt);
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  }
  return false;
}

function textblockAt(node: Node, side: 'start' | 'end', only?: boolean) {
  for (; node; node = (side === 'start' ? node.firstChild : node.lastChild) as Node) {
    if (node.isTextblock) {
      return true;
    }
    if (only && node.childCount !== 1) {
      return false;
    }
  }
  return false;
}

function joinMaybeClear(state: any, $pos: ResolvedPos, dispatch: Dispatch) {
  const before = $pos.nodeBefore,
    after = $pos.nodeAfter,
    index = $pos.index();

  if (!before || !after || !(before.type as NodeTypeWithCompatibleContent).compatibleContent(after.type)) {
    return false;
  }
  if (!before.content.size && $pos.parent.canReplace(index - 1, index)) {
    if (dispatch) {
      dispatch(state.tr.delete($pos.pos - before.nodeSize, $pos.pos).scrollIntoView());
    }
    return true;
  }
  if (!$pos.parent.canReplace(index, index + 1) || !(after.isTextblock || canJoin(state.doc, $pos.pos))) {
    return false;
  }
  if (dispatch) {
    dispatch(
      state.tr
        .clearIncompatible($pos.pos, before.type, before.contentMatchAt(before.childCount))
        .join($pos.pos)
        .scrollIntoView()
    );
  }
  return true;
}
