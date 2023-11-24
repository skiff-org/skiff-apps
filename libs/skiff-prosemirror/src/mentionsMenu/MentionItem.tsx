import { Size, ThemeMode, Typography } from 'nightwatch-ui';
import { EditorView } from 'prosemirror-view';
import React, { FunctionComponent, useMemo } from 'react';
import { formatName } from 'skiff-front-utils';
import { NwContentType } from 'skiff-graphql';

import { UserAvatar } from '../shared/UserAvatar';
import Icon from '../ui/Icon';
import '../ui/skiff-editor-menus.css';

import { insertMentionNode, InviteMentionType, MentionPlaceholder, MentionRef, UserMentionType } from './utils';

/**
 * Item for displaying other commands in the menu like cancel
 * @param placeHolder {MentionPlaceholder}
 * @param view {EditorView}
 */

export const MentionMenuPlaceholder: FunctionComponent<{
  placeHolder: MentionPlaceholder;
  view: EditorView;
  selected: boolean;
}> = ({ placeHolder, view, selected }) => {
  const commandFn = () => placeHolder.command(view);
  return (
    <div
      className={selected ? 'skiff-editor-menu-selected-item' : 'skiff-editor-menu-item'}
      id={placeHolder.id}
      key={placeHolder.id}
      onClick={commandFn}
      onKeyPress={() => {}}
      role='button'
      tabIndex={0}
    >
      {placeHolder.icon}
      <Typography forceTheme={ThemeMode.DARK}>{formatName(placeHolder.label)}</Typography>
    </div>
  );
};

/**
 * Item for displaying other commands in the menu like cancel
 * @param item {MentionRef}
 * @param view {EditorView}
 */

const MentionItem: FunctionComponent<{
  item: MentionRef;
  view: EditorView;
  theme: ThemeMode;
  selected: boolean;
  onUserMention: (userID: string, nodeID: string) => void;
}> = ({ item, view, selected, onUserMention }) => {
  const icon = useMemo(() => {
    if (item.type === UserMentionType || item.type === InviteMentionType) {
      return <UserAvatar label={item.name} size={Size.SMALL} forceTheme={ThemeMode.DARK} />;
    }
    if (item.type === NwContentType.RichText) {
      return Icon.get('file', ThemeMode.DARK);
    }
    if (item.type === NwContentType.Folder) {
      return Icon.get('folder', ThemeMode.DARK);
    }
    if (item.type === NwContentType.Pdf) {
      return Icon.get('pdf', ThemeMode.DARK);
    }
    // Just in case something goes wrong we return the doc icon by default
    return Icon.get('file', ThemeMode.DARK);
  }, [item]);

  const commandFn = () => {
    insertMentionNode(view, item, onUserMention);
  };

  return (
    <div
      className={selected ? 'skiff-editor-menu-selected-item' : 'skiff-editor-menu-item'}
      data-test={`mention-item-${item.name}`}
      id={item.id}
      key={item.id}
      onClick={commandFn}
      onKeyPress={() => {}}
      role='button'
      tabIndex={0}
    >
      {icon}
      <Typography forceTheme={ThemeMode.DARK}>{formatName(item.name)}</Typography>
    </div>
  );
};
export default MentionItem;
