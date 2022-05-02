/* eslint-disable @typescript-eslint/no-explicit-any */
declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

import { Editor, Node } from '@tiptap/react';
import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Decoration } from 'prosemirror-view';

declare module '@tiptap/react' {
  interface NodeViewProps<O = any> {
    editor: Editor;
    node: ProseMirrorNode;
    decorations: Decoration[];
    selected: boolean;
    extension: Node<O>;
    getPos: () => number;
    updateAttributes: (attributes: Record<string, any>) => void;
    deleteNode: () => void;
  }
}

declare global {
  interface Window {
    ReactNativeWebView: any;
  }
}
