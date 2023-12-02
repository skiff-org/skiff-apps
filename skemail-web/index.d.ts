/* eslint-disable @typescript-eslint/no-explicit-any */

declare module '*.svg' {
  const content: any;
  export const ReactComponent: any;
  export default content;
}

import { Window as KeplrWindow } from '@keplr-wallet/types/build/window';
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
  interface Window extends KeplrWindow {
    ReactNativeWebView: any;
    rnIosKeyboardCbs: any; // A global CB array that react-native can trigger when keyboard height change
    lastIosKeyboardHeight: number; // A global param that react-native can set when ios keyboard is open
    touchesCb: any;
    statusBarHeight: number;
    ethereum: any;
    solana: any;
    phantom: any;
    isBitKeep: boolean;
    bitkeep: {
      ethereum: any;
      solana: any;
    };
    IsSkiffWindowsDesktop: boolean;
  }
}
