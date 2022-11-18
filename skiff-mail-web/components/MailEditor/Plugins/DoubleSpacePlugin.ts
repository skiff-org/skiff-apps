import { Extension } from '@tiptap/core';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

const DOUBLE_SPACE_THRESH = 500;

let lastSpace = 0;

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    DoubleSpacePeriodPlugin: {
      /**
       * Add period after double space
       */
      doubleSpacePeriod: () => ReturnType;
    };
  }
}

const shouldAddPeriod = (node?: ProsemirrorNode<any> | null | undefined) => {
  if (!node || !node.isText || !node.text) return false;
  const text = node.text;
  const lastChar = text.charAt(text.length - 2);
  const secondLastChar = text.charAt(text.length - 3);
  return lastChar && secondLastChar && lastChar === ' ' && secondLastChar !== ' ' && secondLastChar !== '.';
};

// On Mobile add period after double space
export const DoubleSpacePeriodPlugin = Extension.create({
  name: 'doubleSpacePeriodPlugin',
  addCommands() {
    return {
      doubleSpacePeriod:
        () =>
        ({ tr, editor, state }) => {
          const now = Date.now();
          const elapsedTime = now - lastSpace;
          if (elapsedTime < DOUBLE_SPACE_THRESH) {
            const sel = editor.state.selection;
            if (!sel.empty) return false;
            const before = editor.state.doc.resolve(sel.head).nodeBefore;
            if (!before || !shouldAddPeriod(before)) return false;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tr.replaceWith(sel.head - 2, sel.head - 1, state.schema.text('. ', before.marks));
            return false;
          } else {
            lastSpace = now;
          }
          return false;
        }
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            input: (_view, event: Event & { data?: any }) => {
              if (event.data && event.data === ' ') {
                this.editor.commands.doubleSpacePeriod();
              }
              return false;
            }
          }
        }
      })
    ];
  }
});
