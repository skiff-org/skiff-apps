import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';
import { v4 as uuidv4 } from 'uuid';

import { OrderedList } from '../OrderedList';
/**
 * This is s plugin that adds a unique ID to a node.
 * This exists in the paid version of TipTap, thats why I wrote it.
 * To add an ID to a specific node type, add its name to the list `NODES_WITH_IDS`.
 */
const NODES_WITH_IDS = [OrderedList.name];
export const UuidPlugin = Extension.create({
  name: 'uuidPlugin',
  addGlobalAttributes() {
    return [
      {
        types: NODES_WITH_IDS,
        attributes: {
          uuid: {
            default: null,
            rendered: true,
            keepOnSplit: false
          }
        }
      }
    ];
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (_transactions, oldState, newState) => {
          // no changes
          if (newState.doc === oldState.doc) {
            return;
          }
          const tr = newState.tr;

          newState.doc.descendants((node, pos) => {
            if (!node.attrs.uuid && NODES_WITH_IDS.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                uuid: uuidv4().replaceAll('-', '')
              });
            }
          });

          return tr;
        }
      })
    ];
  }
});
