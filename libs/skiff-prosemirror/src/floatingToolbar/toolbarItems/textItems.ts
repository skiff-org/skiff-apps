import crelt from 'crelt';
import { Icon, IconProps } from 'nightwatch-ui';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { EditorHighlightColorIds, EditorTextColorIds, HIGHLIGHT_COLORS, TEXT_COLORS } from 'skiff-front-utils';

import { bindCommands } from '../../createEditorKeyMap';
import {
  CLEAR_FORMAT,
  COMMENT,
  EM,
  H1,
  H2,
  H3,
  INDENT_LESS,
  INDENT_MORE,
  INDENT_TOGGLE_ITEM_LESS,
  INDENT_TOGGLE_ITEM_MORE,
  LINK_SET_URL,
  PARAGRAPH_COMMAND,
  STRIKE,
  STRONG,
  TABLE_MOVE_TO_NEXT_CELL,
  TABLE_MOVE_TO_PREV_CELL,
  TEXT_COLOR,
  TEXT_HIGHLIGHT,
  TEXT_INSERT_TAB_SPACE,
  UNDERLINE
} from '../../EditorCommands';
import { isSelectionInNonLinkableNodes } from '../../inputRules/linkRules';
import { TEXT } from '../../NodeNames';
import { getToolbarType } from '../utils';

import AnimatedDropdown from './customMenu/AnimatedDropdown';
import SkiffMenuItem from './customMenu/SkiffMenuItem';
import { itemsMap, ToolbarItemsIds } from './itemsMap';
import { bulletListItem, orderedListItem, todoListItem, toggleListItem } from './nodesItems';
import { checkIfNodeIsParagraph, createElementWithClassAndIcon } from './utils';

const HEADINGS = [
  {
    id: ToolbarItemsIds.H1,
    command: H1.execute,
    isActive: H1.isActive
  },
  {
    id: ToolbarItemsIds.H2,
    command: H2.execute,
    isActive: H2.isActive
  },
  {
    id: ToolbarItemsIds.H3,
    command: H3.execute,
    isActive: H3.isActive
  }
];

export const headingsItems = HEADINGS.map(
  (heading, idx) =>
    new SkiffMenuItem({
      select: (state: EditorState) => {
        const toolbarType = getToolbarType(state);
        return itemsMap[toolbarType].includes(heading.id);
      },
      active: (state: EditorState) => heading.isActive(state),
      render: () =>
        createElementWithClassAndIcon({
          type: 'div',
          iconName: `${heading.id}` as IconProps['icon'],
          label: `Heading ${idx + 1}`,
          defaultColor: true
        }),
      run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
        heading.command(state, dispatch);
      },
      id: heading.id
    })
);

export const paragraphItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.PARAGRAPH);
  },
  active: (state: EditorState) => checkIfNodeIsParagraph(state),
  class: 'paragraph-toolbar-item',
  render: () => createElementWithClassAndIcon({ type: 'div', iconName: Icon.Text, label: 'Body', defaultColor: true }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    PARAGRAPH_COMMAND.execute(state, dispatch);
  },
  id: ToolbarItemsIds.PARAGRAPH
});

const HIGHLIGHT_CLASS_PREFIX = '-highlight';
export const getSpecialBackgrounds = (color: string) => {
  const isTransparent = HIGHLIGHT_COLORS[EditorHighlightColorIds.TRANSPARENT] === color;
  const isGrayHighlighted = HIGHLIGHT_COLORS[EditorHighlightColorIds.GRAY] === color;
  const isGray = TEXT_COLORS[EditorTextColorIds.GRAY] === color;
  const grayWithoutAlpha = '#707070';
  const transparentRepresentation =
    'linear-gradient(to bottom right, transparent calc(50% - 1px), red calc(50% - 1px), red calc(50% + 1px), transparent calc(50% + 1px))';
  if (isTransparent) {
    return transparentRepresentation;
  }
  if (isGray || isGrayHighlighted) {
    return grayWithoutAlpha;
  }
  return color;
};

const createTextColorIcon = (color: string, prefix: string, highlight?: boolean) => {
  const isTransparent = EditorHighlightColorIds.TRANSPARENT === color;
  const icon = crelt('span', {
    class: `text${prefix}-color-item-icon  ${isTransparent ? 'transparent-toolbar-icon' : ''}`
  });
  if (highlight) {
    icon.style.background = getSpecialBackgrounds(HIGHLIGHT_COLORS[color] as string);
    icon.appendChild(
      crelt('span', {
        class: `text-highlight-color-item-inner-icon`
      })
    );
  } else {
    icon.style.background = getSpecialBackgrounds(TEXT_COLORS[color] as string);
  }

  const container = crelt('div', { class: `text${prefix}-color-item` }, icon);

  return container;
};

const textColorItems = Object.keys(TEXT_COLORS).map(
  (color) =>
    new SkiffMenuItem({
      select: (state: EditorState) => {
        const toolbarType = getToolbarType(state);
        return itemsMap[toolbarType].includes(ToolbarItemsIds.TEXT_COLOR);
      },
      active: (state: EditorState) => TEXT_COLOR.isActive(state, TEXT_COLORS[color]),
      render: () => createTextColorIcon(color, ''),
      run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
        TEXT_COLOR.executeWithUserInput(state, dispatch, view, TEXT_COLORS[color]);
      },
      id: ToolbarItemsIds.TEXT_COLOR,
      eventType: 'mousedown'
    })
);

const textHighlightColorItems = Object.keys(HIGHLIGHT_COLORS).map(
  (color) =>
    new SkiffMenuItem({
      select: (state: EditorState) => {
        const toolbarType = getToolbarType(state);
        return itemsMap[toolbarType].includes(ToolbarItemsIds.TEXT_HIGHLIGHT);
      },
      active: (state: EditorState) => TEXT_HIGHLIGHT.isActive(state, HIGHLIGHT_COLORS[color]),
      render: () => createTextColorIcon(color, HIGHLIGHT_CLASS_PREFIX, true),
      run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
        TEXT_HIGHLIGHT.executeWithUserInput(state, dispatch, view, HIGHLIGHT_COLORS[color]);
      },
      id: ToolbarItemsIds.TEXT_HIGHLIGHT,
      eventType: 'mousedown'
    })
);

const colorsItems = [...textColorItems, ...textHighlightColorItems];
const richTextItems = [paragraphItem, ...headingsItems, todoListItem, bulletListItem, toggleListItem, orderedListItem];

export const textColorsItemDropdown = new AnimatedDropdown(colorsItems, {
  label: 'color-icon',
  class: 'text-color-dropdown',
  dataTest: 'text-color-dropdown-btn'
});

export const textItemDropdown = new AnimatedDropdown(richTextItems, {
  label: 'Body',
  class: 'text-item-dropdown',
  dataTest: 'text-item-dropdown-btn'
});

export const strongItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.STRONG);
  },
  active: (state: EditorState) => STRONG.isActive(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Bold,
      tooltip: 'Bold',
      tooltipCmd: '⌘+B',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    STRONG.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.STRONG
});

export const underlineItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.UNDERLINE);
  },
  active: (state: EditorState) => UNDERLINE.isActive(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Underline,
      tooltip: 'Underline',
      tooltipCmd: '⌘+U',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    UNDERLINE.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.UNDERLINE
});

export const italicItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.ITALIC);
  },
  active: (state: EditorState) => EM.isActive(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Italic,
      tooltip: 'Italicize',
      tooltipCmd: '⌘+I',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    EM.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.ITALIC
});

export const strikeItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.STRIKE);
  },
  active: (state: EditorState) => STRIKE.isActive(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Strikethrough,
      tooltip: 'Strikethrough',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    STRIKE.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.STRIKE
});

export const clearFormatItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    return itemsMap[toolbarType].includes(ToolbarItemsIds.CLEAR_FORMAT);
  },
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.ClearFormatting,
      tooltip: 'Clear formatting',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void) => {
    CLEAR_FORMAT.execute(state, dispatch);
  },
  id: ToolbarItemsIds.CLEAR_FORMAT
});

export const linkItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    if (isSelectionInNonLinkableNodes(state.selection)) return false;
    return itemsMap[toolbarType].includes(ToolbarItemsIds.LINK);
  },
  active: (state: EditorState) => STRIKE.isActive(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Link,
      dataTest: 'insert-link',
      tooltip: 'Link',
      tooltipCmd: '⌘+K',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    LINK_SET_URL.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.LINK
});

export const commentItem = new SkiffMenuItem({
  select: (state: EditorState) => {
    const toolbarType = getToolbarType(state);
    let textContent = '';

    state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
      if (node.type === state.schema.nodes[TEXT]) {
        textContent += node.textContent;
        return false;
      }
      return true;
    });

    return itemsMap[toolbarType].includes(ToolbarItemsIds.COMMENT) && textContent.length > 0; // enable comments on selection with two chars ot more
  },
  enable: (state: EditorState) => COMMENT.isEnabled(state),
  render: () =>
    createElementWithClassAndIcon({
      type: 'div',
      iconName: Icon.Comment,
      dataTest: 'comment-menu-item',
      tooltip: 'Comment',
      defaultColor: true
    }),
  run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
    COMMENT.execute(state, dispatch, view);
  },
  id: ToolbarItemsIds.COMMENT,
  eventType: 'click'
});

const INDENT_MORE_COMMANDS = [INDENT_TOGGLE_ITEM_MORE, TABLE_MOVE_TO_NEXT_CELL, TEXT_INSERT_TAB_SPACE, INDENT_MORE];

const INDENT_LESS_COMMANDS = [INDENT_TOGGLE_ITEM_LESS, TABLE_MOVE_TO_PREV_CELL, INDENT_LESS];

export const indentationItems = [
  new SkiffMenuItem({
    select: (state: EditorState) => {
      const toolbarType = getToolbarType(state);
      return itemsMap[toolbarType].includes(ToolbarItemsIds.INDENT_LESS);
    },
    enable: (state: EditorState) => INDENT_LESS_COMMANDS.some((command) => command.isEnabled(state)),
    active: (state: EditorState) => INDENT_LESS_COMMANDS.some((command) => command.isActive(state)),
    render: () =>
      createElementWithClassAndIcon({
        type: 'div',
        iconName: Icon.DecreaseIndent,
        tooltip: 'Unindent',
        defaultColor: true
      }),
    run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
      const command = bindCommands(...INDENT_LESS_COMMANDS);
      command(state, dispatch, view);
    },
    id: ToolbarItemsIds.INDENT_LESS
  }),
  new SkiffMenuItem({
    select: (state: EditorState) => {
      const toolbarType = getToolbarType(state);
      return itemsMap[toolbarType].includes(ToolbarItemsIds.INDENT_MORE);
    },
    enable: (state: EditorState) => INDENT_MORE_COMMANDS.some((command) => command.isEnabled(state)),
    active: (state: EditorState) => INDENT_MORE_COMMANDS.some((command) => command.isActive(state)),
    render: () =>
      createElementWithClassAndIcon({
        type: 'div',
        iconName: Icon.IncreaseIndent,
        tooltip: 'Indent',
        defaultColor: true
      }),
    run: (state: EditorState, dispatch: (tr: Transaction) => void, view: EditorView) => {
      const command = bindCommands(...INDENT_MORE_COMMANDS);
      command(state, dispatch, view);
    },
    id: ToolbarItemsIds.INDENT_MORE
  })
];
