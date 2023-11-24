/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NodeNames as TableNodeNames } from '@skiff-org/prosemirror-tables';
import { MarkdownSerializerState } from 'prosemirror-markdown';
import { Fragment, Node as PMNode } from 'prosemirror-model';
import { findTextNodes } from 'prosemirror-utils';

import { BULLET_LIST, ORDERED_LIST, PARAGRAPH, TODO_LIST, TOGGLE_LIST } from '../NodeNames';

export const renderTodoList = (state: MarkdownSerializerState, node: PMNode) => {
  const indent = node.attrs.indent as number;
  node.content.forEach((item) => {
    const checked = item.attrs.checked as boolean;
    const checkMark = checked ? 'X' : ' ';
    let text = '';
    try {
      text = findTextNodes(item, true)[0].node.text || '';
    } catch (error) {
      console.error('renderTodoList error', error);
    }
    const space = state.repeat(' ', indent * 4);
    state.write(`${space}- [${checkMark}] ${text}`);
    state.write('\n');
  });
};

export const renderOrderedList = (state: MarkdownSerializerState, node: PMNode) => {
  const { start, indent } = node.attrs as { start: number; indent: number };
  let count = start;
  node.content.forEach((child) => {
    const space = state.repeat(' ', indent * 4);
    state.write(`${space}${count}. `);
    state.renderInline(child);
    state.ensureNewLine(); // Ensure there's exactly one newline after each list item
    count++;
  });
};

export const renderBulletList = (state: MarkdownSerializerState, node: PMNode) => {
  const indent = node.attrs.indent as number;
  node.content.forEach((item) => {
    const space = state.repeat(' ', indent * 4);
    state.write(`${space} - `);

    // Iterate over the item's content and render inline
    item.content.forEach((child) => {
      state.renderInline(child);
    });

    state.write('\n');
  });
};

//Renders the first row of the table
export const renderHeaderRow = (state: MarkdownSerializerState, headerRowContent: Fragment<any>) => {
  state.write('|');
  headerRowContent.forEach((cellNode) => {
    const textContent = findTextNodes(cellNode, true)[0]?.node.text;
    if (textContent) {
      state.write(`${textContent}`);
    }
    state.write(` |`);
  });
  state.write('\n');
  //adding heading separator
  headerRowContent.forEach(() => {
    state.write('|---');
  });
  // closing heading separator row
  state.write(`|\n`);
};

// Renders list items for lists, different from regular list rendering since markdown does not support lists in cells
const renderListItem = (state: MarkdownSerializerState, node: PMNode, listType: string) => {
  const textNodes = findTextNodes(node, true);
  textNodes.forEach((node, index) => {
    const textNode = node.node;

    if (listType === ORDERED_LIST) {
      state.write(`${index + 1}. `);
    }
    if (listType === BULLET_LIST) {
      state.write(`- `);
    }
    if (listType === TODO_LIST) {
      state.write(`[] `);
    }
    if (listType === TOGGLE_LIST) {
      state.write(`> `);
    }
    if (textNode.text) {
      state.write(textNode.text);
      state.write('<br>');
    }
  });
};
const renderTextNode = (state: MarkdownSerializerState, node: PMNode) => {
  const textNode = findTextNodes(node, true)[0]?.node;
  if (!textNode) {
    return;
  }

  if (textNode.text) {
    let outputText = textNode.text;

    textNode.marks.forEach((mark) => {
      switch (mark.type.name) {
        case 'strong':
          outputText = `**${outputText}**`; // bold
          break;
        case 'em':
          outputText = `*${outputText}*`; // italic
          break;
        case 'link':
          outputText = `[${outputText}](${(mark.attrs.href as string | undefined) ?? ''})`; // link
          break;
        case 'code':
          outputText = `\`${outputText}\``; // inline code
          break;
        // Add more cases for other marks as necessary.
      }
    });

    state.write(outputText);
    state.write('<br>');
  }
};

// For each cell it will check what kind of node is in it and renders it accordingly
export const renderCellRow = (state: MarkdownSerializerState, row: PMNode) => {
  // opening row
  state.write('|');

  row.content.forEach((tableCellNode) => {
    tableCellNode.content.forEach((node) => {
      const nodeType = node.type.name;
      switch (nodeType) {
        case PARAGRAPH:
          renderTextNode(state, node);
          break;
        case TableNodeNames.DATE:
          renderTextNode(state, node);
          break;
        case TableNodeNames.LABEL:
          const labels: Array<{ title: string; color: string }> = node.attrs.labels as Array<{
            title: string;
            color: string;
          }>;
          labels.forEach((label) => {
            state.write(`${label.title};`);
          });
          state.write('<br>');
          break;
        case ORDERED_LIST:
          renderListItem(state, node, ORDERED_LIST);
          break;

        case BULLET_LIST:
          renderListItem(state, node, BULLET_LIST);
          break;

        case TODO_LIST:
          renderListItem(state, node, TODO_LIST);
          break;

        case TOGGLE_LIST:
          renderListItem(state, node, TOGGLE_LIST);
          break;
      }
    });
    state.write(' |');
  });
  // closing the node with linebreak
  state.write('\n');
};

export const renderMention = (state: MarkdownSerializerState, node: PMNode) => {
  state.write(`@${node.attrs.name as string}`);
};
