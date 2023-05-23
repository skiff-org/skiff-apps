import { Plugin } from 'prosemirror-state';
import { findParentNode } from 'prosemirror-utils';
import isURL from 'validator/lib/isURL';

import { MARK_LINK } from './MarkNames';
import nodeAt from './nodeAt';
import sanitizeURL from './sanitizeURL';
import uuid from './ui/uuid';
// Matches the last continuous string of characters without whitespace in the string that will be tested for it being a URL
const regex = /\S+$/;
const anyPredicate = () => true;

/**
 * Inserts a link mark on the detected URL string after the user presses enter after it
 */
const InsertLinkOnEnter = new Plugin({
  props: {
    handleKeyDown(view, event) {
      const { state } = view;
      if (event.code === 'Enter') {
        // Get start pos of node at selection
        const { from } = state.selection;
        const textContentParent = findParentNode(anyPredicate)(state.selection);
        const lastNodePos = textContentParent?.start; // The start position of the node we want to add link meta
        const selectionAtStart = lastNodePos === from; // Is the selection at the end of the node

        // If the selection is not at the end of the node do not create link
        if (!lastNodePos || selectionAtStart) return false;

        const lastNode = nodeAt(state.doc, from - 1);
        // The text length is the distance from start of node to the selection
        const textLength = from - lastNodePos;
        const lastWord = lastNode?.textContent.substring(0, textLength).match(regex);

        // Clean candidate string of extra letters
        const candidateString = lastWord?.[0] ? lastWord?.[0] : undefined;

        // if we have a last word and its a url we dispatch the transaction to add link mark
        if (candidateString && isURL(candidateString)) {
          const { tr, selection, schema } = view.state;
          view.dispatch(
            tr.addMark(
              selection.from - candidateString.length,
              selection.from,
              schema.marks[MARK_LINK].create({
                href: sanitizeURL(candidateString),
                id: uuid()
              })
            )
          );
        }
      }
      return false;
    }
  }
});

export default InsertLinkOnEnter;
