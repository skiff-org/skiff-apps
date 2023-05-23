/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ThemeMode } from 'nightwatch-ui';
import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { EditorHighlightColorIds, EditorTextColorIds, HIGHLIGHT_COLORS, TEXT_COLORS } from 'skiff-front-utils';
import { assertExists } from 'skiff-utils';

import {
  CODE,
  EM,
  H1,
  H2,
  H3,
  HR,
  MATH_INSERT,
  OL,
  STRONG,
  SUB_PAGE,
  TABLE_INSERT_TABLE,
  TEXT_COLOR,
  TEXT_HIGHLIGHT,
  TO_DO,
  TOGGLE_LIST_INSERT,
  UL,
  IMAGE_INSERT
} from '../EditorCommands';
import FontTypeCommand from '../FontTypeCommand';
import { FontNameIcons, FontNameIds, FontNameLabels } from '../FontTypeMarkSpec';
import createPopUp from '../ui/createPopUp';
import Icon from '../ui/Icon';
import ImageUploadPane from '../ui/ImageUploadPane';

import getColorIcon from './ColorIcon';
import {
  boldCommand,
  cancelSlashMenu,
  changeFontTypeCommand,
  changeHighLightColorCommand,
  changeTextColorCommand,
  headerCommands,
  horizontalRuleCommand,
  insertAfterNoMatchCommand,
  insertCodeBlocksCommand,
  insertTableCommand,
  italicCommand,
  latexCommand,
  openSubMenu,
  orderedListCommand,
  subpageCommand,
  todoListCommand,
  toggleListCommand,
  unorderedListCommand
} from './commands';
import { HeadingIds, MenuItemNamesIds, SubMenuTypes } from './InterfacesAndEnums';

// Slash menu can call list commands from a paragraph with no textnode in it like an empty table cell,
// in this case isEnabled would return false
// however if there would be a textNode with even a '​'char in it, the command would work.
// ListToggleCommand.ts executes command with this considered when the command is from slash menu
const isToggleListEnabled = (state: EditorState, isEnabled: (state: EditorState) => boolean) => {
  const newTr = state.tr.insertText('​');
  const testState = EditorState.create({
    schema: state.schema,
    doc: state.doc,
    selection: state.selection
  }).apply(newTr);
  return isEnabled(state) || isEnabled(testState);
};

export const defaultMainMenuItems = [
  {
    id: MenuItemNamesIds.SUB_PAGE,
    label: 'Subpage',
    icon: Icon.get('file-subpage', ThemeMode.DARK),
    enabled: SUB_PAGE.isEnabled,
    command: subpageCommand
  },
  {
    id: MenuItemNamesIds.TODO,
    label: 'Todo list',
    icon: Icon.get('todo', ThemeMode.DARK),
    enabled: (state: EditorState) => isToggleListEnabled(state, TO_DO.isEnabled),
    command: todoListCommand
  },
  {
    id: MenuItemNamesIds.UL,
    label: 'Bulleted list',
    icon: Icon.get('bullet-list', ThemeMode.DARK),
    enabled: (state: EditorState) => isToggleListEnabled(state, UL.isEnabled),
    command: unorderedListCommand
  },
  {
    id: MenuItemNamesIds.OL,
    label: 'Numbered list',
    icon: Icon.get('number-list', ThemeMode.DARK),
    enabled: (state: EditorState) => isToggleListEnabled(state, OL.isEnabled),
    command: orderedListCommand
  },
  {
    id: MenuItemNamesIds.TOGGLE_LIST,
    label: 'Toggle list',
    icon: Icon.get('toggle-list', ThemeMode.DARK),
    enabled: (state: EditorState) => isToggleListEnabled(state, TOGGLE_LIST_INSERT.isEnabled),
    command: toggleListCommand
  },
  {
    id: MenuItemNamesIds.INSERT_TABLE,
    label: 'Table',
    icon: Icon.get('table', ThemeMode.DARK),
    enabled: TABLE_INSERT_TABLE.isEnabled,
    command: insertTableCommand
  },
  {
    id: MenuItemNamesIds.HEADING,
    icon: Icon.get('h1', ThemeMode.DARK),
    label: 'Heading',
    enabled: H1.isEnabled,
    command: (view: EditorView) => openSubMenu(view, SubMenuTypes.HEADING_MENU)
  },
  {
    id: MenuItemNamesIds.HR,
    label: 'Horizontal rule',
    icon: Icon.get('horizontal-rule', ThemeMode.DARK),
    enabled: HR.isEnabled,
    command: horizontalRuleCommand
  },
  {
    id: MenuItemNamesIds.COLOR_TEXT,
    label: 'Text color',
    icon: Icon.get('palette', ThemeMode.DARK),
    enabled: TEXT_COLOR.isEnabled,
    command: (view: EditorView) => openSubMenu(view, SubMenuTypes.TEXT_COLOR_MENU, true)
  },
  {
    id: MenuItemNamesIds.COLOR_HIGHLIGHT,
    label: 'Highlight color',
    icon: Icon.get('highlight', ThemeMode.DARK),
    enabled: TEXT_HIGHLIGHT.isEnabled,
    command: (view: EditorView) => openSubMenu(view, SubMenuTypes.HIGHLIGHT_MENU, true)
  },
  {
    id: MenuItemNamesIds.LATEX,
    label: 'Equation',
    icon: Icon.get('equation', ThemeMode.DARK),
    enabled: MATH_INSERT.isEnabled,
    command: latexCommand
  },
  {
    id: MenuItemNamesIds.CODE_BLOCK,
    label: 'Code',
    icon: Icon.get('code-block', ThemeMode.DARK),
    enabled: CODE.isEnabled,
    command: insertCodeBlocksCommand
  },
  {
    id: MenuItemNamesIds.FONT_TYPE,
    label: 'Font',
    icon: Icon.get('text', ThemeMode.DARK),
    // testing if the first font command is enabled, if it is, the rest of them are enabled too since the check is the same
    enabled: new FontTypeCommand(FontNameIds.SYSTEM, FontNameLabels.SYSTEM).isEnabled,
    command: (view: EditorView) => openSubMenu(view, SubMenuTypes.FONT_TYPE_MENU, true)
  },
  {
    id: MenuItemNamesIds.BOLD,
    label: 'Bold',
    icon: Icon.get('bold', ThemeMode.DARK),
    enabled: STRONG.isEnabled,
    command: boldCommand
  },
  {
    id: MenuItemNamesIds.ITALIC,
    label: 'Italic',
    icon: Icon.get('italic', ThemeMode.DARK),
    enabled: EM.isEnabled,
    command: italicCommand
  },
  {
    id: MenuItemNamesIds.IMAGE,
    label: 'Insert image',
    icon: Icon.get('image', ThemeMode.DARK),
    enabled: IMAGE_INSERT.isEnabled,
    command: (view: EditorView) => {
      // create popup here because we need an <input> element to allow for file upload
      createPopUp(
        ImageUploadPane,
        {
          editorState: view.state
        },
        {
          modal: false,
          onClose: (imgSrc: string) => {
            const schema = view.state.schema as Schema;
            assertExists(schema.nodes.image, 'Image node not found in schema');
            const node = schema.nodes.image.create({
              src: imgSrc
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            let { tr } = view.state;
            const { selection } = view.state;
            tr = tr.setSelection(selection);
            const transaction = tr.insert(tr.selection.from, node);
            view.dispatch(transaction);
          },
          anchor: view.dom,
          autoDismiss: false,
          closeOnClick: false
        }
      );
    }
  }
];

export const defaultHeaderItems = [
  {
    id: HeadingIds.H1,
    label: 'Heading 1',
    icon: Icon.get('h1', ThemeMode.DARK),
    enabled: H1.isEnabled,
    command: headerCommands.H1
  },
  {
    id: HeadingIds.H2,
    label: 'Heading 2',
    icon: Icon.get('h2', ThemeMode.DARK),
    enabled: H2.isEnabled,
    command: headerCommands.H2
  },
  {
    id: HeadingIds.H3,
    label: 'Heading 3',
    icon: Icon.get('h3', ThemeMode.DARK),
    enabled: H3.isEnabled,
    command: headerCommands.H3
  }
];

export const getDefaultTextColorItems = () =>
  Object.keys(EditorTextColorIds).map((key) => ({
    id: EditorTextColorIds[key],
    label: EditorTextColorIds[key],
    icon: getColorIcon(TEXT_COLORS[EditorTextColorIds[key]]),
    enabled: true,
    command: (view: EditorView) => changeTextColorCommand(view, TEXT_COLORS[EditorTextColorIds[key]])
  }));

export const getDefaultHighlightColorItems = () =>
  Object.keys(EditorHighlightColorIds).map((key) => ({
    id: EditorHighlightColorIds[key],
    label: EditorHighlightColorIds[key],
    icon: getColorIcon(HIGHLIGHT_COLORS[EditorHighlightColorIds[key]]),
    enabled: true,
    command: (view: EditorView) => changeHighLightColorCommand(view, HIGHLIGHT_COLORS[EditorHighlightColorIds[key]])
  }));

export const getDefaultFontItems = () =>
  Object.keys(FontNameIds).map((key) => ({
    id: FontNameIds[key],
    label: FontNameLabels[key],
    fontName: FontNameIds[key],
    icon: Icon.get((FontNameIcons[key] as string).toLowerCase(), ThemeMode.DARK),
    enabled: true,
    command: (view: EditorView) => changeFontTypeCommand(view, FontNameIds[key])
  }));

export const noMatchItems = [
  {
    id: 'item-insert',
    label: 'Insert text',
    icon: Icon.get('corner-down-left', ThemeMode.DARK),
    enabled: true,
    command: insertAfterNoMatchCommand
  },
  {
    id: 'item-cancel',
    label: 'Cancel',
    icon: Icon.get('escape', ThemeMode.DARK),
    enabled: true,
    command: cancelSlashMenu
  }
];
