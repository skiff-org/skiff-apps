import '../ui/skiff-editor-menus.css';

import { ThemeMode, Typography, TypographySize, TypographyWeight } from '@skiff-org/skiff-ui';
import { EditorView } from 'prosemirror-view';
import React, { ForwardRefRenderFunction, useEffect, useMemo } from 'react';
import styled from 'styled-components';

import { BodyPopup, positionBodyPopupAccordingToSelection } from '../comments/components/BodyPopup';
import { EditorCustomState } from '../skiffEditorCustomStatePlugin';
import { freezeAll } from '../utils/scrollController';

import MentionItem, { MentionMenuPlaceholder } from './MentionItem';
import useMentionSuggestions from './useMentionSuggestions';
import {
  InviteMentionType,
  MENTION_MENU_ID,
  MentionMenuState,
  MentionMetaTypes,
  mentionsKey,
  NonSkiffUserID,
  UserMentionType
} from './utils';

const MENTIONS_MENU_SIZE = { width: 250, height: 200 };
const MENTIONS_MENU_OFFSETS = { top: 35, left: 0 };

export const MENTIONS_MENU_CLASS = 'mentions-menu-wrapper';

const TextContainer = styled.div`
  padding: 4px 8px;
`;

type EditorMentionsMenuProps = {
  view: EditorView;
  mentionMenuState: MentionMenuState;
  customState: EditorCustomState;
};
/**
 * Responsible for displaying the menu that the user sees, displays the MentionMenuPlugin state
 * @param view {EditorView}
 * @param pluginState {MentionMenuState}
 */
const EditorMentionsMenuRenderFunction: ForwardRefRenderFunction<HTMLDivElement, EditorMentionsMenuProps> = (
  { view, mentionMenuState, customState }: EditorMentionsMenuProps,
  ref
) => {
  const { theme, onMention, getMentionSuggestions } = customState;

  const { suggestions, allSuggestions } = useMentionSuggestions(mentionMenuState.filter, getMentionSuggestions);

  const { open } = mentionMenuState;

  // dispatching the available documents to the plugin when available
  useEffect(() => {
    const tr = view.state.tr.setMeta(mentionsKey, {
      type: MentionMetaTypes.receiveMention,
      documents: suggestions.documents,
      users: suggestions.users,
      actions: suggestions.actions
    });
    view.dispatch(tr);
  }, [suggestions]);

  // hide the editors cursor while the menu is open
  useEffect(() => {
    view.dom.classList.toggle('invisible-cursor', true);
    const unFreeze = freezeAll();
    return () => {
      // make the cursor visibe again
      view.dom.classList.toggle('invisible-cursor', false);
      unFreeze();
    };
  }, []);

  const mentionsPopupCoords = useMemo(
    () => positionBodyPopupAccordingToSelection(view, MENTIONS_MENU_SIZE, 30, MENTIONS_MENU_OFFSETS),
    []
  );

  if (!open) {
    return null;
  }

  const filteredInviteUsers = suggestions.users.filter((user) => user.type === InviteMentionType);
  const filteredMentionUsers = suggestions.users.filter((user) => user.type === UserMentionType);

  return (
    <BodyPopup {...mentionsPopupCoords}>
      <div className={MENTIONS_MENU_CLASS} ref={ref}>
        <div
          className='mentions-menu'
          id={MENTION_MENU_ID}
          style={{ gap: suggestions.users.length || suggestions.documents.length ? '5px' : '0px' }}
        >
          {suggestions && (
            <>
              {filteredMentionUsers.length > 0 && (
                <>
                  <TextContainer>
                    <Typography
                      weight={TypographyWeight.MEDIUM}
                      color='secondary'
                      size={TypographySize.SMALL}
                      forceTheme={ThemeMode.DARK}
                    >
                      People
                    </Typography>
                  </TextContainer>
                  {filteredMentionUsers.map((user) => (
                    <MentionItem
                      selected={allSuggestions[mentionMenuState.selectedOption]?.id === user.id}
                      theme={theme}
                      item={user}
                      key={`${user.id}_${user.name}`}
                      view={view}
                      onUserMention={() => void onMention}
                    />
                  ))}
                </>
              )}
              {filteredInviteUsers.length > 0 && (
                <>
                  <TextContainer>
                    <Typography
                      weight={TypographyWeight.MEDIUM}
                      color='secondary'
                      size={TypographySize.SMALL}
                      forceTheme={ThemeMode.DARK}
                    >
                      Not shared
                    </Typography>
                  </TextContainer>
                  {filteredInviteUsers.map((user) => (
                    <MentionItem
                      key={`${user.id}_${user.name}`}
                      selected={allSuggestions[mentionMenuState.selectedOption]?.id === user.id}
                      theme={theme}
                      item={{
                        name: user.id === NonSkiffUserID ? mentionMenuState.filter : user.name,
                        type: InviteMentionType,
                        id: NonSkiffUserID
                      }}
                      view={view}
                      onUserMention={() => void onMention}
                    />
                  ))}
                </>
              )}
              {suggestions.documents.length ? (
                <>
                  <TextContainer>
                    <Typography
                      weight={TypographyWeight.MEDIUM}
                      color='secondary'
                      size={TypographySize.SMALL}
                      forceTheme={ThemeMode.DARK}
                    >
                      Files
                    </Typography>
                  </TextContainer>
                  {suggestions.documents.map((doc) => (
                    <MentionItem
                      selected={allSuggestions[mentionMenuState.selectedOption].id === doc.id}
                      theme={theme}
                      item={doc}
                      key={`${doc.id}_${doc.name}`}
                      view={view}
                      onUserMention={() => void onMention}
                    />
                  ))}
                </>
              ) : (
                <></>
              )}

              {suggestions.actions.length ? (
                <>
                  <TextContainer>
                    <Typography
                      weight={TypographyWeight.MEDIUM}
                      color='secondary'
                      size={TypographySize.SMALL}
                      forceTheme={ThemeMode.DARK}
                    >
                      Actions
                    </Typography>
                  </TextContainer>
                  {suggestions.actions.map((action) => (
                    <MentionMenuPlaceholder
                      selected={allSuggestions[mentionMenuState.selectedOption]?.id === action?.id}
                      key={action.id}
                      placeHolder={action}
                      view={view}
                    />
                  ))}
                </>
              ) : (
                <></>
              )}
            </>
          )}
        </div>
      </div>
    </BodyPopup>
  );
};

const EditorMentionsMenu = React.forwardRef(EditorMentionsMenuRenderFunction);
export default EditorMentionsMenu;
