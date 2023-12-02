import { CommandProps, Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

import Link from '../Link/Link';

export const popupTypePluginKey = new PluginKey('popup-type');

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
      /*
       * Toggle color popup
       */
      toggleColorPopup: () => ReturnType;
      /*
       * Close color popup
       */
      closeColorPopup: () => ReturnType;
      /*
       * Open color popup
       */
      openColorPopup: () => ReturnType;
    };
  }
}

export enum PopupPluginType {
  Link = 'LINK',
  Color = 'COLOR',
  TextColor = 'TEXT_COLOR',
  None = 'NONE'
}

export const dispatchPluginPopupOpenTr = (popupType: PopupPluginType) => {
  return () =>
    ({ tr, dispatch }: CommandProps) => {
      // if (editor.isActive(Link.name)) return false;
      tr.setMeta(popupTypePluginKey, { open: popupType });
      console.log('set to', popupType);
      if (dispatch) {
        dispatch(tr);
        return true;
      }
      return false;
    };
};

export const dispatchPluginToggleTr = (popupType: PopupPluginType, markName?: string) => {
  return () =>
    ({ tr, dispatch, state, editor }: CommandProps) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const oldState = popupTypePluginKey.getState(state).open;
      if (markName) {
        if (editor.isActive(markName) && oldState === PopupPluginType.None) {
          return false;
        }
      }
      const newState = oldState === popupType ? PopupPluginType.None : popupType;
      tr.setMeta(popupTypePluginKey, { open: newState });
      if (dispatch) {
        dispatch(tr);
        return true;
      }
      return false;
    };
};

/**
 * This Extension is to handle the create link popup
 * adds 3 commands to open, close and toggle it.
 * also adds a plugin to keep a state if its open/closed
 */
export const CreatePopupPlugin = Extension.create({
  addCommands() {
    return {
      openLinkCreatePopup: dispatchPluginPopupOpenTr(PopupPluginType.Link),
      closeLinkCreatePopup: dispatchPluginPopupOpenTr(PopupPluginType.None),
      toggleLinkCreatePopup: dispatchPluginToggleTr(PopupPluginType.Link, Link.name),
      toggleColorPopup: dispatchPluginToggleTr(PopupPluginType.Color),
      closeColorPopup: dispatchPluginPopupOpenTr(PopupPluginType.None)
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin<{ open: PopupPluginType }>({
        key: popupTypePluginKey,
        state: {
          init() {
            return {
              open: PopupPluginType.None
            };
          },
          apply(tr, state) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            const meta = tr.getMeta(popupTypePluginKey);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (meta?.open !== undefined)
              return {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
                open: meta.open
              };
            return state;
          }
        }
      })
    ];
  }
});
