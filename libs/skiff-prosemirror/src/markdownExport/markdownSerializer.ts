import * as DOMPurify from 'dompurify';
import { MarkdownSerializer } from 'prosemirror-markdown';
import { Node } from 'prosemirror-model';

import {
  MARK_CODE,
  MARK_COMMENT,
  MARK_EM,
  MARK_FONT_SIZE,
  MARK_FONT_TYPE,
  MARK_LINK,
  MARK_NO_BREAK,
  MARK_SPACER,
  MARK_STRIKE,
  MARK_STRONG,
  MARK_SUPER,
  MARK_TEXT_COLOR,
  MARK_TEXT_HIGHLIGHT,
  MARK_TEXT_SELECTION,
  MARK_UNDERLINE,
  MARK_YCHANGE
} from '../MarkNames';
import {
  BLOCKQUOTE,
  BOOKMARK,
  BULLET_LIST,
  CODE_BLOCK,
  DOC_DESCRIPTION,
  DOC_HEADER_HR,
  DOC_ICON,
  DOC_TITLE,
  FILE_EMBED,
  HARD_BREAK,
  HEADING,
  HORIZONTAL_RULE,
  IMAGE,
  LIST_ITEM,
  MATH_DISPLAY,
  MENTION,
  ORDERED_LIST,
  PARAGRAPH,
  SUBPAGE,
  TABLE,
  TEXT,
  TODO_LIST,
  TOGGLE_ITEM_CONTENT,
  TOGGLE_ITEM_TITLE,
  TOGGLE_LIST,
  TOGGLE_LIST_ITEM
} from '../NodeNames';

import {
  renderBulletList,
  renderCellRow,
  renderHeaderRow,
  renderMention,
  renderOrderedList,
  renderTodoList
} from './utils';

/**
 * Markdown serializer that can turn proseMirror doc into a string complying with markdown rules
 */
export const mdSerializer = new MarkdownSerializer(
  {
    [BLOCKQUOTE]: (state, node) => {
      state.wrapBlock('> ', undefined, node, () => state.renderContent(node));
      state.ensureNewLine();
    },
    [CODE_BLOCK]: (state, node) => {
      // Count the number of consecutive backticks in the code block and then create a string of that many backticks + 1
      let longest = 2; // start at two so that number of backticks is always at least 3
      let currentRun = 0;
      for (const char of node.textContent) {
        if (char === '`') {
          currentRun += 1;
        } else {
          if (currentRun > longest) {
            longest = currentRun;
          }
          currentRun = 0;
        }
      }
      if (currentRun > longest) {
        longest = currentRun;
      }

      const backtickString = '`'.repeat(longest + 1);

      state.write(backtickString + `${node.attrs.params || ''}\n`);
      state.text(node.textContent, false);
      state.ensureNewLine();
      state.write(backtickString);
      state.closeBlock(node);
    },
    [MATH_DISPLAY]: (state, node) => {
      state.text(node.textContent, false);
      state.ensureNewLine();
      state.closeBlock(node);
    },
    [HEADING]: (state, node) => {
      state.write(`${state.repeat('#', node.attrs.level)} `);
      state.renderInline(node);
      state.closeBlock(node);
    },
    [BOOKMARK]: (state, node) => {
      const id = node.attrs.id;
      const visible = node.attrs.visible;

      if (id) {
        if (visible) {
          // If visible, render it as a link with the anchor as its href.
          state.write(`[Bookmark](#${id})`);
        } else {
          // If not visible, just render the anchor.
          // rendering it as a markdown link without a label, which
          // doesn't produce visible output but does mark the location.
          state.write(`[](#${id})`);
        }
      }
    },
    [FILE_EMBED]: () => {},
    [HORIZONTAL_RULE]: (state, node) => {
      state.write(node.attrs.markup || '---');
      state.closeBlock(node);
    },
    [BULLET_LIST]: (state, node) => {
      renderBulletList(state, node);
    },
    [ORDERED_LIST]: (state, node) => {
      renderOrderedList(state, node);
    },
    [TODO_LIST]: (state, node) => {
      renderTodoList(state, node);
    },
    [TOGGLE_LIST]: (state, node) => {
      // For TOGGLE_LIST, simply iterate over its children.
      // Each child will be rendered as its own details/summary pair.
      node.forEach((child) => {
        state.render(child);
      });
    },
    [TOGGLE_ITEM_TITLE]: (state, node) => {
      // Begin the details tag and then render the summary.
      state.write('<details>\n');
      state.write(`<summary>${node.textContent}</summary>\n`);
    },
    [TOGGLE_ITEM_CONTENT]: (state, node) => {
      state.renderContent(node);
    },
    [TOGGLE_LIST_ITEM]: (state, node) => {
      // Assuming TOGGLE_LIST_ITEM comprises of a title and content.
      // This will be covered by the other renderers.
      // After rendering its content, we'll close the details.
      node.forEach((child) => {
        state.render(child);
      });
      state.write('</details>\n');
    },
    [LIST_ITEM]: (state, node) => {
      state.renderContent(node);
    },
    [PARAGRAPH]: (state, node) => {
      state.renderInline(node);
      state.closeBlock(node);
    },
    [MENTION]: (state, node) => {
      renderMention(state, node);
    },
    [IMAGE]: (state, node) => {
      state.write(
        `![${state.esc(node.attrs.alt || '')}](${state.esc(node.attrs.src)}${
          node.attrs.title ? ` ${state.quote(node.attrs.title)}` : ''
        })`
      );
    },
    [HARD_BREAK]: (state, node, parent, index) => {
      for (let i = index + 1; i < parent.childCount; i++)
        if (parent.child(i).type != node.type) {
          state.write('\\\n');
          return;
        }
    },
    [TEXT]: (state, node) => {
      let sanitized = '{}';
      if (node.text) {
        sanitized = DOMPurify.sanitize(node.text) || '{}';
      }
      state.text(sanitized);
    },
    [DOC_TITLE]: (state, node) => {
      state.write(`#${node.textContent || 'Untitled Document'}\n`);
    },
    // TODO: find way to render icons in md
    [DOC_ICON]: () => {},
    [DOC_DESCRIPTION]: (state, node) => {
      state.write(`${node.textContent || ''}\n`);
    },
    [DOC_HEADER_HR]: (state, node) => {
      state.write(node.attrs.markup || '---');
      state.closeBlock(node);
    },
    [TABLE]: (state, node) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const content: Array<Node> = node.content.content;
      const headerRow = content[0].content;
      const contentRows = content.filter((item, idx) => idx !== 0);
      renderHeaderRow(state, headerRow);
      contentRows.forEach((row) => {
        renderCellRow(state, row);
      });
    },
    [SUBPAGE]: (state, node) => {
      // theres no way to get the page title, also, only shared users will be able to use this link.
      const { host, protocol } = window.location;
      state.write(
        `[subpage-${(node.attrs.docID as string | undefined) ?? ''}](${protocol}${host}/file/${
          (node.attrs.docID as string | undefined) ?? ''
        })\n`
      );
      state.write('\n');
      state.ensureNewLine();
    }
  },
  {
    [MARK_EM]: {
      open: '*',
      close: '*',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_STRONG]: {
      open: '**',
      close: '**',
      mixable: true,
      expelEnclosingWhitespace: true
    },

    [MARK_LINK]: {
      open(_state, mark, parent, index) {
        return '[';
      },
      close(state, mark, parent, index) {
        return `](${state.esc(mark.attrs.href)}${mark.attrs.title ? ` ${state.quote(mark.attrs.title)}` : ''})`;
      }
    },
    [MARK_CODE]: {
      open: '`',
      close: '`',
      mixable: true
    },
    [MARK_FONT_SIZE]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_FONT_TYPE]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_NO_BREAK]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_TEXT_COLOR]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_TEXT_HIGHLIGHT]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_TEXT_SELECTION]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_STRIKE]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_SUPER]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_UNDERLINE]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_SPACER]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_COMMENT]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    },
    [MARK_YCHANGE]: {
      open: '',
      close: '',
      mixable: true,
      expelEnclosingWhitespace: true
    }
  }
);
