import '../ui/skiff-editor-menus.css';

import { Icon as IconEnum, InputField, Size } from '@skiff-org/skiff-ui';
import { PluginKey, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import React from 'react';
import ReactDOM from 'react-dom';

import { MENTION } from '../NodeNames';
import { MetaTypes } from '../slashMenu/InterfacesAndEnums';
import Icon from '../ui/Icon';
import uuid from '../ui/uuid';

export const mentionsKey = new PluginKey<MentionMenuState>('mentions');
export const MENTION_MENU_ID = 'mention-menu-div';

export const UserMentionType = 'user-mention';
export const InviteMentionType = 'invite-mention';
export const NonSkiffUserID = 'non-skiff-user-id';

/**
 * @interface MentionRef - for the information that is needed to create a Mention node
 */
export interface MentionRef {
  name: string;
  type: string;
  id: string;
}

export interface MentionSuggestions {
  documents: Array<MentionRef>;
  users: Array<MentionRef>;
}

export interface MentionSuggestionsWithActions extends MentionSuggestions {
  actions: Array<MentionCommand>;
}

/**
 * @interface MentionMenuState - the props MentionMenu uses in its state
 * @param open {boolean} -  is the menu opened
 * @param position {number} -  position of the cursor in the editor when the menu was opened
 * @param filter {string} -  user input for searching between the docs
 * @param inCommentsEditor {boolean} indicator whether the editor is the comments editor
 * @param selectedOption {number} -  index of the selected option in the suggestion array
 * @param suggestions {MentionSuggestions>, documents: Array<MentionRef>} the current suggestions recived from client
 */
export interface MentionMenuState {
  open: boolean;
  position: number;
  filter: string;
  selectedOption: number;
  inCommentsEditor: boolean;
  suggestions: MentionSuggestionsWithActions;
}
/**
 * @enum MentionMetaTypes - transaction meta types that the menu can handle
 * stepUp and stepDown handle the user selecting with up and down arrow keys
 * inputChange handles when the user starts filtering
 * receiveDocs is a transaction in which the plugin receives the available documents for filtering from the EditorMentionsMenu.tsx
 */
export enum MentionMetaTypes {
  open = 'open',
  close = 'close',
  stepUp = 'stepUp',
  stepDown = 'stepDown',
  inputChange = 'inputChange',
  receiveMention = 'receive_mention'
}

/**
 * @interface MentionPlaceholder - for the MentionPlaceholder item
 */
export interface MentionPlaceholder {
  id: string;
  label: string;
  icon: React.ReactElement<any>;
  command: (view: EditorView) => void;
}

/**
 * @function Setting the selected items class and un-setting the previously selected items class
 * @param itemArray {Array<MentionRef>} -  the current items in the menu
 * @param selectedItem {MentionRef} -  the item that is selected
 */
export const setMentionRefClasses = (
  itemArray: MentionSuggestions | Array<MentionPlaceholder>,
  selectedItem: MentionRef | MentionPlaceholder
) => {
  const allItems = Array.isArray(itemArray) ? itemArray : Object.values(itemArray).flat();
  // explicitly typing because of TS error
  allItems.map((item: MentionRef | MentionPlaceholder) => {
    const element = document.getElementById(item.id);

    if (element instanceof HTMLElement) {
      element.className = 'skiff-editor-menu-item';
    }

    return true;
  });
  const element = document.getElementById(selectedItem.id);
  if (element instanceof HTMLElement) {
    element.className = 'skiff-editor-menu-selected-item';
  }
};

/**
 * @function Returns the MentionRef that is currently selected
 * @param mentionMenuProps {MentionMenuState}
 */
export const getSelectedMentionRef = (mentionMenuProps: MentionMenuState): MentionRef | undefined => {
  if (mentionMenuProps.suggestions.users.length || mentionMenuProps.suggestions.documents.length) {
    return [...mentionMenuProps.suggestions.users, ...mentionMenuProps.suggestions.documents].flat()[
      mentionMenuProps.selectedOption
    ];
  }

  return undefined;
};
/**
 * @function Returns the MentionPlaceHolder that is currently selected
 * @param mentionMenuProps {MentionMenuState}
 */
export const getSelectedPlaceholder = (mentionMenuProps: MentionMenuState) => {
  if (!(mentionMenuProps.suggestions.users?.length || mentionMenuProps.suggestions.documents?.length)) {
    return CommandsAfterNoMatch[mentionMenuProps.selectedOption];
  }

  return undefined;
};
/**
 * @function Dispatches the transaction to close the menu
 * @param view {EditorView}
 */
export const closeMentionMenu = (view: EditorView) => {
  const newTr: Transaction = view.state.tr.setMeta(mentionsKey, {
    type: MetaTypes.close
  });

  view.dispatch(newTr);
};

export interface MentionCommand {
  id: string;
  label: string;
  icon: React.ReactElement;
  command: (view: EditorView) => void;
}

const ClosePlaceHolder: MentionCommand = {
  id: 'close-action',
  label: 'Close',
  icon: Icon.get('escape'),
  command: closeMentionMenu
};

export const CommandsAfterNoMatch = [ClosePlaceHolder];

/**
 * @function to insert a selected mention node into the editor
 * @param view {EditorView}
 * @param mentionRef {MentionRef}
 */
export const insertMentionNode = (
  view: EditorView,
  mentionRef: MentionRef,
  onUserMention: (userID: string, nodeID: string) => void
) => {
  const mentionsState = mentionsKey.getState(view.state);
  const nodeID = uuid();
  const attrs = {
    name: mentionRef.name,
    id: mentionRef.id,
    type: mentionRef.type,
    nodeID,
    hidePreview: mentionsState?.inCommentsEditor
  };

  const node = view.state.schema.nodes[MENTION].create(attrs);
  const tr = view.state.tr
    .replaceWith(view.state.selection.from - (mentionsState?.filter.length || 0) - 1, view.state.selection.to, node)
    .insertText(' ')
    .setMeta(mentionsKey, { type: MentionMetaTypes.close });
  view.dispatch(tr);
  view.focus();

  // send mention notification if the mention is UserMention and not in comments editor(we sent when the comment is submitted)
  if (mentionRef.type === UserMentionType && !mentionsState?.inCommentsEditor) {
    onUserMention(mentionRef.id, nodeID);
  }
};

export enum MenuDirection {
  up = 'up',
  down = 'down'
}

/**
 * @function to calculate if the selected item should be changed or not
 * We only change the selected item if the filtered list is short enough that the previously selected item is out of bound
 * This is to prevent the selection to jump to the start of the list unnecessarily
 * @param trMeta { documents: Array<MentionRef> }
 * @param state {MentionMenuState}
 */
export const mentionMenuShouldChangeSelected = (
  props: MentionMenuState,
  suggestions: MentionSuggestionsWithActions
): boolean =>
  suggestions.users.length + suggestions.actions.length + suggestions.documents.length < props.selectedOption;
export const MENTIONS_INPUT_CLASS = 'mentions-input-decoration';

export const createMentionsInputDecration = (mentionMenuState: MentionMenuState) => {
  const decoContainer = document.createElement('div');
  decoContainer.classList.add(MENTIONS_INPUT_CLASS);

  ReactDOM.render(
    <InputField
      size={Size.SMALL}
      icon={IconEnum.Search}
      placeholder='Mention a user or a file...'
      value={mentionMenuState.filter}
      disabled={true}
    />,
    decoContainer
  );

  return decoContainer;
};
