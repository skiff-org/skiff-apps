import { Node as ProseMirrorNode } from 'prosemirror-model';
import { PluginKey } from 'prosemirror-state';
import { Decoration, EditorView, NodeView } from 'prosemirror-view';

import { ProsemirrorDocJson } from '../Types';
import { ThreadAttrs } from '../Types';

export type CommentWithPos = {
  node: ProseMirrorNode;
  pos: number;
  comment: ThreadAttrs;
};
export interface EditorNodeViews {
  [key: string]: (
    node: ProseMirrorNode,
    view: EditorView,
    getPos: boolean | (() => number),
    decorations: Decoration[]
  ) => NodeView;
}

export interface ActiveThread {
  from: number;
  to: number;
  id: string[];
}

export interface CommentDraft {
  commentId?: string;
  threadId: string;
  content: ProsemirrorDocJson;
}

export type CommentPluginState = {
  open: boolean;
  activeThread: ActiveThread | null;
  comments: CommentWithPos[];
  showResolved: boolean;
  draft: CommentDraft | null;
};
export const commentPluginKey = new PluginKey<CommentPluginState>('commentPlugin');

export const openEmptyThreadPopupKey = 'openEmptyThreadPopup'; // open the empty thread popup
export const closeEmptyThreadPopupKey = 'closeEmptyThreadPopup'; // close the empty thread popup
export const activeThreadKey = 'activeThread'; // use null ActiveThread a meta values
export const updateDraftKey = 'updateDraft';
export const toggleShowResolvedKey = 'toggleShowResolved';
