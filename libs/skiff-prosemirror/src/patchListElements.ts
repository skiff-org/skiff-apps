import nullthrows from 'nullthrows';

import HTMLMutator from './HTMLMutator';
import { ATTRIBUTE_LIST_STYLE_TYPE } from './ListItemNodeSpec';
import { gdocListLevel } from './listNodeSpecUtils';
import { ATTRIBUTE_COUNTER_RESET, ATTRIBUTE_FOLLOWING } from './OrderedListNodeSpec';
import { ATTRIBUTE_INDENT, convertMarginLeftToIndentValue, EMPTY_CSS_VALUE } from './ParagraphNodeSpec';
import { ATTRIBUTE_CSS_BEFORE_CONTENT } from './patchStyleElements';
import uuid from './ui/uuid';

export default function patchListElements(doc: Document): void {
  // In Google Doc, lists are exported as indented
  // (e.g. style="margin-left: 48pt") list elements which is the default DOM
  // structure that `skiff-prosemirror` supports. However, other doc providers
  // (e.g Office 365) may export lists as nested list elements that can't
  // be rendered properly.
  // Before proceeding further, it needs to convert the nested list elements
  // into indented list elements.
  wrapNestedLists(doc);
  liftNestedListElements(doc);
  liftNestedListsGDocs(doc);

  Array.from(doc.querySelectorAll('ol, ul')).forEach(patchListElementsElement);
} // This assumes that every 36pt maps to one indent level.

const CHAR_BULLET = '\u25cf';
const CHAR_CIRCLE = '\u25cb';
const CHAR_SQUARE = '\u25a0';
const CHAR_BOX = '\u274f';
const CHAR_ZERO_SPACE = '\u200B';
const INLINE_NODE_NAME_PATTERN = /^(#text)|(A|SPAN|B|STRONG)$/;

function patchListElementsElement(listElement: Element): void {
  // If the children of `listElement` all have teh same marginLeft, assume
  // it to be indented.
  let marginLeft: string | null | undefined;
  let beforeContent: string | string[] | null | undefined;
  const { parentElement, children } = listElement;

  // A workaround to patch the issue when <ul /> or <ol /> is pasted as the
  // first child of <body />, its first <li /> somehow can't be wrapped
  // with the list. The hack is to prepend zero-width-space character
  // before the list.
  if (parentElement && parentElement.nodeName === 'BODY' && parentElement.firstChild === listElement) {
    const tt = parentElement.ownerDocument.createTextNode(CHAR_ZERO_SPACE);
    parentElement.insertBefore(tt, listElement);
  }

  Array.from(children).forEach((listItemElement) => {
    if (!(listItemElement instanceof HTMLElement)) return;
    const { style } = listItemElement;
    patchPaddingStyle(listItemElement);
    const bc = listItemElement.getAttribute(ATTRIBUTE_CSS_BEFORE_CONTENT) || '';

    if (beforeContent === undefined) {
      beforeContent = bc;
    }

    if (beforeContent !== bc) {
      beforeContent = null;
    }

    const ml = (style && style.marginLeft) || '';

    if (marginLeft === undefined) {
      marginLeft = ml;
    }

    if (ml !== marginLeft) {
      marginLeft = null;
    }
  });

  if (marginLeft) {
    const indent = convertMarginLeftToIndentValue(marginLeft);

    if (indent) {
      listElement.setAttribute(ATTRIBUTE_INDENT, String(indent));
    }
  }

  if (beforeContent) {
    beforeContent = String(beforeContent);
    let listStyleType;

    switch (true) {
      case beforeContent.indexOf(CHAR_BULLET) > -1:
        listStyleType = 'disc';
        break;

      case beforeContent.indexOf(CHAR_CIRCLE) > -1:
        listStyleType = 'circle';
        break;

      case beforeContent.indexOf(CHAR_SQUARE) > -1:
        listStyleType = 'square';
        break;

      case beforeContent.indexOf(CHAR_BOX) > -1:
        listStyleType = 'box';
        break;

      case beforeContent.indexOf('lower-latin') > -1:
        listStyleType = 'lower-latin';
        break;

      case beforeContent.indexOf('upper-latin') > -1:
        listStyleType = 'upper-latin';
        break;

      case beforeContent.indexOf('lower-roman') > -1:
        listStyleType = 'lower-roman';
        break;

      case beforeContent.indexOf('upper-roman') > -1:
        listStyleType = 'upper-roman';
        break;

      case beforeContent.indexOf('-') > -1:
        listStyleType = 'dash';
        break;

      default:
        console.log('unknown list style type', beforeContent);
        break;
    }

    if (listStyleType) {
      listElement.setAttribute(ATTRIBUTE_LIST_STYLE_TYPE, listStyleType);
    }
  }
}

// This moves the styles of <li /> into its content <p />.
function patchPaddingStyle(listItemElement: HTMLElement): void {
  const { style, childNodes } = listItemElement;
  const { paddingTop, paddingBottom, lineHeight } = style;

  if (!EMPTY_CSS_VALUE.has(paddingBottom) && !EMPTY_CSS_VALUE.has(paddingTop) && !EMPTY_CSS_VALUE.has(lineHeight)) {
    return;
  }

  const doc = listItemElement.ownerDocument;
  const frag = doc.createDocumentFragment();
  let contentIsInline = true;
  Array.from(childNodes).forEach((cn) => {
    contentIsInline = contentIsInline && INLINE_NODE_NAME_PATTERN.test(cn.nodeName);
    frag.appendChild(cn);
  });

  if (contentIsInline) {
    // Wrap all inline content with <p /> with the padding style applied.
    const pEl = doc.createElement('p');
    Object.assign(pEl.style, {
      lineHeight,
      paddingBottom,
      paddingTop
    });
    pEl.appendChild(frag);
    listItemElement.appendChild(pEl);
  } else {
    // Unable to patch the style.
    listItemElement.appendChild(frag);
  }
}

function wrapNestedLists(doc: Document): void {
  // SEE https://linear.app/skiff/issue/PROD-941/ensure-pasting-indented-lists-from-apple-notes-are-parsed-correctly
  //
  // For some reason when you copy nested lists from Apple notes, the lists are
  // DIRECTLY nested under the parent lists eg.
  // <ol>
  //   <li>first</li>
  //   <ol>
  //     <li>second</li>
  //   </ol>
  // </ol>d
  // This function wraps those lists with <li> elements for liftNestedListElements()
  // to later unwrap them completely as direct children of single <ol> element
  const selector = ' ol > ol, ul > ul';
  const els = Array.from(doc.querySelectorAll(selector));
  const htmlMutator = new HTMLMutator(doc);
  els.forEach((list) => {
    htmlMutator.insertHTMLBefore(`<li>`, list);
    htmlMutator.insertHTMLAfter('</li>', list);
  });
  htmlMutator.execute();
}

// This converts all nested list elements into indented list elements.
// For instance,
// == UI ==
// 1. AA
//   1. BB
//   2. BB
// 2. AA
// == DOM Structure (Before) ==
// <ol> <!-- Parent List -->
//   <li>
//     AA
//     <ol> <!-- Child (nested) List -->
//       <li>BB</li>
//       <li>BB</li>
//     </ol>
//   </li>
//   <li> AA</li>
// </ol>
// == DOM Structure (After) ==
// <ol name="x">
//   <li>AA</li>
// </ol>
// <ol data-indent="1">
//   <li>BB</li>
//   <li>BB</li>
// </ol>
// <ol data-following="x" data-counter-reset-"none">
//   <li>AA</li>
// </ol>
function liftNestedListElements(doc: Document): void {
  const selector = 'li > ol, li > ul';
  const els = Array.from(doc.querySelectorAll(selector));
  const htmlMutator = new HTMLMutator(doc);

  els.forEach((list) => {
    const indent = findIndentLevel(list);
    list.setAttribute('data-indent', String(indent));
    const parentListItem = nullthrows(list.parentElement);
    const parentList = nullthrows(parentListItem.parentElement);
    const parentListNodeName = parentList.nodeName.toLowerCase();
    const isLast = parentList.lastElementChild === parentListItem;
    const style = parentList.getAttribute('style') || '';
    // The parent list will be split into two lists and the second list should
    // follow the first list.
    const followingName = parentList.getAttribute('name') || uuid();
    parentList.setAttribute('name', followingName);
    // Stub HTML snippets that will lift the list.
    // Before:
    // <ol>
    //   <li>
    //     AAA
    //     <ol><li>BBB</li></ol>
    //   </li>
    //   <li>CCC</li>
    // </ol>
    // After:
    // <ol><li>AAA</li></ol>
    // <ol><li>BBB</li></ol>
    // <ol><li>CCC</li></ol>
    // Close the parent list before the list.
    htmlMutator.insertHTMLBefore(`</${parentListNodeName}>`, list);
    // Open a new list after list.
    htmlMutator.insertHTMLAfter(
      `<${parentListNodeName}
          style="${style}"
          class="${parentList.className}"
          ${ATTRIBUTE_COUNTER_RESET}="none"
          ${ATTRIBUTE_FOLLOWING}="${followingName}">`,
      list
    );

    if (isLast) {
      // The new list after list is an empty list, comment it out.
      htmlMutator.insertHTMLAfter('<!--', list).insertHTMLAfter('-->', parentList);
    }
  });
  htmlMutator.execute();
}

function findIndentLevel(el: Element): number {
  let indent = 0;
  let currentEl = el.parentElement;

  while (currentEl) {
    const { nodeName } = currentEl;

    if (nodeName === 'OL' || nodeName === 'UL') {
      indent += 1;
    } else if (nodeName !== 'LI') {
      break;
    }

    currentEl = currentEl.parentElement;
  }

  return indent;
}

// This converts all nested ordered/bullet list elements into consecutive ordered lists with indents according to the selector.
// For instance,
// == UI ==
// 1. AA
//   i. BB
//      1. CC
// 2. AA
// == DOM Structure (Before) ==
// <ol> <!-- Parent List -->
//   <li>
//     AA
//   </li>
//   <ol> <!-- Child (nested) List -->
//       <li>BB</li>
//       <ol>
//       <li>CC</li>
//       </ol>
//
//   </ol>
// </ol>
// <ol>
//   <li>AA<li/>
// </ol>

// == DOM Structure (After) ==
// <ol data-indent="0">
//   <li>AA</li>
// </ol>
// <ol data-indent="1">
//   <li>BB</li>
// </ol>
// <ol data-indent="2">
//   <li>CC</li>
// </ol>
// <ol data-indent="0">
//   <li>AA</li>
// </ol>

// <ol data-indent="0">
//   <li>AA</li>
//   <ol data-indent="1">
//      <li>BB</li>
//   </ol>
//   <li>CC<li>
// </ol>
function liftNestedListsGDocs(doc: Document): void {
  const els = Array.from(doc.querySelectorAll('ul,ol'));
  const htmlMutator = new HTMLMutator(doc);
  els.forEach((listElement) => {
    const firstListItem = listElement.firstChild;
    // The parent list will be closed and the child list follow the first list.
    const listName = listElement.getAttribute('name') || uuid();
    const indent = firstListItem && firstListItem instanceof Element ? gdocListLevel(firstListItem) : undefined;
    // if no indent is found the list is not from google docs and we dont want to execute this fn
    if (indent === undefined) {
      return;
    }
    // tagOpen indicates whether the list HTML tag is closed temporarily because the current listElement.children[i] is not a list item,
    // but another list item which need to be brought up to the same level in the html tree, which we do by closing and opening the <ul> or <ol> tags around it
    let tagOpen = false;
    for (let i = 0; i < listElement.children.length; i++) {
      const listNode = nullthrows(listElement.children[i].parentElement);
      const listNodeName = listNode.nodeName.toLowerCase();
      // if the tag is not open and we see the current element is a list itself not a list item, we close the open list tag
      if (
        !tagOpen &&
        (listElement.children[i] instanceof HTMLUListElement || listElement.children[i] instanceof HTMLOListElement)
      ) {
        tagOpen = true;
        htmlMutator.insertHTMLBefore(listNodeName === 'ul' ? `</ul>` : '</ol>', listElement.children[i]);
      }
      // when we see list items again we can open our original list tag again, until we see another <ul> or <ol> element
      if (tagOpen && listElement.children[i] instanceof HTMLLIElement) {
        tagOpen = false;
        htmlMutator.insertHTMLBefore(
          listNodeName === 'ul'
            ? `<ul data-indent="${String(indent)}" name="${listName}" >`
            : `<ol data-indent="${String(indent)}" name="${listName}" data-counter-reset="none">`,
          listElement.children[i]
        );
      }
    }
    listElement.setAttribute('data-indent', String(indent));
    listElement.setAttribute('name', listName);
  });
  htmlMutator.execute();
}
