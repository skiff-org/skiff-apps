import '../ui/skiff-editor-menus.css';
import { ThemeMode, Typography } from 'nightwatch-ui';
import { EditorView } from 'prosemirror-view';
import React, { FunctionComponent, useCallback } from 'react';

import Icon from '../ui/Icon';

import { MenuItem, MenuItemNamesIds } from './InterfacesAndEnums';

export const SlashMenuPlaceholder: FunctionComponent<{ label: string }> = ({ label }) => (
  <div className='skiff-editor-menu-item'>{label}</div>
);

const SlashMenuItem: FunctionComponent<{
  item: MenuItem;
  view: EditorView;
}> = ({ item, view }) => {
  const commandFn = useCallback(() => {
    item.command(view);
    view.focus();
  }, [view, item]);
  const arrowIcon = Icon.get('chevron-right', ThemeMode.DARK);
  return (
    <div
      className='skiff-editor-menu-item'
      data-test={item.id}
      id={item.id}
      key={item.id}
      onClick={commandFn}
      onKeyPress={() => {}}
      role='button'
      tabIndex={0}
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '4px',
          padding: '6px'
        }}
      >
        {item?.icon}
      </div>
      <Typography forceTheme={ThemeMode.DARK}>{item.label}</Typography>
      {/* add right arrow for deeper menu */}
      {(item.id === MenuItemNamesIds.HEADING ||
        item.id === MenuItemNamesIds.FONT_TYPE ||
        item.id === MenuItemNamesIds.COLOR_TEXT ||
        item.id === MenuItemNamesIds.COLOR_HIGHLIGHT) && <div className='skiff-editor-menu-arrow'>{arrowIcon}</div>}
    </div>
  );
};

export default SlashMenuItem;
