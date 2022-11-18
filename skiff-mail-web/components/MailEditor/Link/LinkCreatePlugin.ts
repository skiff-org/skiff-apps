import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

import Link from './Link';

export const linkCreatePopupPluginKey = new PluginKey('link-create-popup');

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    LinkCreatePopup: {
      /**
       * Open the create link popup
       */
      openLinkCreatePopup: () => ReturnType;
      /**
       * Close the create link popup
       */
      closeLinkCreatePopup: () => ReturnType;
      /**
       * Toggle the create link popup
       */
      toggleLinkCreatePopup: () => ReturnType;
    };
  }
}

/**
 * This Extension is to handle the create link popup
 * adds 3 commands to open, close and toggle it.
 * also adds a plugin to keep a state if its open/closed
 */
export const LinkCreatePopupPlugin = Extension.create({
  addCommands() {
    return {
      openLinkCreatePopup:
        () =>
        ({ tr, dispatch, editor }) => {
          if (editor.isActive(Link.name)) return false;
          tr.setMeta(linkCreatePopupPluginKey, { open: true });
          if (dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
      closeLinkCreatePopup:
        () =>
        ({ tr, dispatch }) => {
          tr.setMeta(linkCreatePopupPluginKey, { open: false });
          if (dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        },
      toggleLinkCreatePopup:
        () =>
        ({ tr, dispatch, state, editor }) => {
          const oldState = linkCreatePopupPluginKey.getState(state).open;
          if (editor.isActive(Link.name) && !oldState) return false;
          tr.setMeta(linkCreatePopupPluginKey, { open: !oldState });
          if (dispatch) {
            dispatch(tr);
            return true;
          }
          return false;
        }
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<{ open: boolean }>({
        key: linkCreatePopupPluginKey,
        state: {
          init() {
            return {
              open: false
            };
          },
          apply(tr, state) {
            const meta = tr.getMeta(linkCreatePopupPluginKey);
            if (meta?.open !== undefined)
              return {
                open: meta.open
              };
            return state;
          }
        }
      })
    ];
  }
});
