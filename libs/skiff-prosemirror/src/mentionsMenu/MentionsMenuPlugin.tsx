import { Plugin, TextSelection, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { getCustomState } from '..';
import supportedMenuKeys from '../sharedMenuComponents/supportedMenuKeys';

import {
  closeMentionMenu,
  getSelectedMentionRef,
  getSelectedPlaceholder,
  insertMentionNode,
  InviteMentionType,
  mentionMenuShouldChangeSelected,
  MentionMenuState,
  MentionMetaTypes,
  mentionsKey
} from './utils';

const updateInput = (view: EditorView, key: string) => {
  const newTr: Transaction = view.state.tr.setMeta(mentionsKey, {
    type: MentionMetaTypes.inputChange,
    newChar: key
  });
  view.dispatch(newTr);
  return true;
};

/**
 * The plugin used for inserting mention nodes that link to other docs or folders, it opens after `@` character and shows a list that the user can search in
 * we make a function so we can create few instances of the plugin
 */
const MentionsMenuPlugin = (inCommentsEditor?: boolean) =>
  new Plugin<MentionMenuState>({
    key: mentionsKey,
    state: {
      init() {
        return {
          open: false,
          position: 0,
          selectedOption: 0,
          filter: '',
          inCommentsEditor: !!inCommentsEditor,
          suggestions: { users: [], documents: [], actions: [] }
        };
      },

      apply(transaction, state, prevEditorState, editorState) {
        const meta = transaction.getMeta(mentionsKey);

        // this handles the click outside of the menu
        if (transaction.selectionSet && transaction.steps.length === 0) {
          return {
            ...state,
            open: false
          };
        }
        if (!meta) return state;
        switch (meta.type) {
          case MentionMetaTypes.receiveMention:
            const changeSelected = mentionMenuShouldChangeSelected(state, meta);
            return {
              ...state,
              selectedOption: changeSelected ? 0 : state.selectedOption,
              suggestions: {
                users: meta.users,
                documents: meta.documents,
                actions: meta.actions
              }
            };
          case MentionMetaTypes.open:
            return {
              open: true,
              position: editorState.selection.from - 1,
              selectedOption: 0,
              filter: '',
              inCommentsEditor: !!inCommentsEditor,
              suggestions: state.suggestions
            };
          case MentionMetaTypes.close:
            return { ...state, open: false, filter: '' };
          case MentionMetaTypes.stepUp:
            if (
              state.open &&
              state.selectedOption <
                state.suggestions.documents.length +
                  state.suggestions.users.length -
                  1 +
                  state.suggestions.actions.length
            ) {
              return {
                ...state,
                selectedOption: state.selectedOption + 1
              };
            }
            return state;
          case MentionMetaTypes.stepDown:
            if (state.open && state.selectedOption > 0) {
              return {
                ...state,
                selectedOption: state.selectedOption - 1
              };
            }
            break;
          case MentionMetaTypes.inputChange:
            if (state.open) {
              // handles the case when user is deleting characters from the input, it updates the pluginstate
              if (meta.newChar === 'Backspace') {
                if (state.filter.length > 0) {
                  // Since we press backspace slice(0,-1) deletes the last character of the filter string we are filtering for
                  const updatedFilter = state.filter.slice(0, -1);
                  return {
                    ...state,
                    filter: updatedFilter
                  };
                } else {
                  return { ...state, open: false, filter: '' };
                }
              }

              // handling the main case of the user typing into the search input
              const updatedFilter = state.filter + meta.newChar;

              return {
                ...state,
                filter: updatedFilter
              };
            }
            break;
          default:
            return state;
        }
        return state;
      }
    },
    props: {
      handleKeyDown(view, event) {
        const state = mentionsKey.getState(view.state);
        if (!state) return false;

        if (!state.open && event.key === '@') {
          const { selection: sel, doc } = view.state;
          const fakeSelection = TextSelection.create(doc, sel.to - 1, sel.to);
          const lastChar = fakeSelection.content().content.firstChild?.textContent;

          // We only want to open the menu if the @ comes after a whitespace (HSP) or zero with whitespace (ZWSP) in case of inside a table row,tab or is in an empty row
          const shouldOpen = lastChar === ' ' || lastChar === '' || lastChar === ' ' || lastChar === '​';
          if (!shouldOpen) {
            return false;
          }
          const newTr: Transaction = view.state.tr.setMeta(mentionsKey, {
            type: MentionMetaTypes.open
          });
          view.dispatch(newTr);
          return false;
        }

        if (event.code === 'Escape' && state.open) {
          closeMentionMenu(view);
          return true;
        }

        if (event.code === 'ArrowDown' && state.open) {
          const newTr: Transaction = view.state.tr.setMeta(mentionsKey, {
            type: MentionMetaTypes.stepUp
          });
          view.dispatch(newTr);
          return true;
        }

        if (event.code === 'ArrowUp' && state.open) {
          const newTr: Transaction = view.state.tr.setMeta(mentionsKey, {
            type: MentionMetaTypes.stepDown
          });
          view.dispatch(newTr);
          return true;
        }

        // if space is pressed and there no suggestions - close the menu
        if (event.code === 'Space' && state.open) {
          const nonInviteOptions = [...state.suggestions.users, ...state.suggestions.documents].filter(
            (suggestion) => suggestion.type !== InviteMentionType
          );
          // if no suggestions - close the menu
          if (!nonInviteOptions.length) {
            closeMentionMenu(view);
          } else {
            updateInput(view, event.key);
          }
          return false;
        }

        if (event.code === 'Escape' && state.open) {
          closeMentionMenu(view);
          return true;
        }

        // if there are no suggestions then the only available action is closing the menu
        if (
          !(state.suggestions.users.length || state.suggestions.documents.length) &&
          (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Tab') &&
          state.open
        ) {
          const selectedPlaceHolder = getSelectedPlaceholder(state);
          if (selectedPlaceHolder) {
            selectedPlaceHolder.command(view);
            return true;
          }
        }

        // Mention node can be inserted with 'enter' and 'tab'
        if (
          (event.code === 'Enter' || event.code === 'NumpadEnter' || event.code === 'Tab') &&
          state.open &&
          (state.suggestions.users.length || state.suggestions.documents.length)
        ) {
          const mentionRef = getSelectedMentionRef(state);
          if (mentionRef) {
            // when in comments editor we want to send the event only when the comment is submitted
            insertMentionNode(view, mentionRef, inCommentsEditor ? () => {} : getCustomState(view.state).onMention);
          }
          return true;
        }

        if (supportedMenuKeys[event.key] && state.open) {
          updateInput(view, event.key);
          return false;
        }

        return false;
      }
    }
  });

export default MentionsMenuPlugin;
