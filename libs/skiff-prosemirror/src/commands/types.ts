import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

export type Command = (state: EditorState, dispatch?: (tr: Transaction) => void, view?: EditorView | null) => boolean;
