import { Fragment, Node as ProsemirrorNode } from 'prosemirror-model';
import { EditorState, NodeSelection, Transaction } from 'prosemirror-state';

import { MATH_DISPLAY, MATH_INLINE } from './NodeNames';
import { MetaTypes, slashMenuKey } from './slashMenu/InterfacesAndEnums';
import UICommand from './ui/UICommand';

class MathInsertCommand extends UICommand {
  isActive = (state: EditorState): boolean => {
    // TODO: This just does not work! It might be the case the UICommand is buggy, and a disabled command can't be active
    // Which is obviously wrong, since you can't insert math into math, but it can be active if you're in it
    // This function returns the correct value ( true ) in a math node.
    const { selection } = state;
    if (!(selection instanceof NodeSelection)) return false;
    const { type } = selection.node;
    return type.name === MATH_INLINE || type.name === MATH_DISPLAY;
  };

  execute = (state: EditorState, dispatch?: (tr: Transaction) => void): boolean => {
    const { selection, schema } = state;
    // if a transaction is provided we use that and append steps
    let { tr } = state;
    const slashMenuOpen = slashMenuKey.getState(state)?.open;
    // if the slashMenu is open then the command came from there so we close it
    if (slashMenuOpen) {
      tr.setMeta(slashMenuKey, { type: MetaTypes.close });
    }
    const mathDisplay = schema.nodes[MATH_DISPLAY];

    if (!mathDisplay) {
      return false;
    }

    const { from, to } = selection;

    // TODO: un-toggle math nodes?

    if (from !== to) {
      const mathNodes: ProsemirrorNode[] = [];
      selection
        .content()
        .content.forEach((node) => mathNodes.push(mathDisplay.createAndFill({}, schema.text(node.textContent.trim()))));
      tr = tr.replaceWith(from, to, Fragment.from(mathNodes));
      tr = tr.setSelection(NodeSelection.create(tr.doc, from + 1));
    } else {
      tr = tr.insert(from, Fragment.from(mathDisplay.create()));
      tr = tr.setSelection(NodeSelection.create(tr.doc, from + 1));
    }

    if (tr.docChanged) {
      dispatch?.(tr);
      return true;
    }
    return false;
  };
}

export default MathInsertCommand;
