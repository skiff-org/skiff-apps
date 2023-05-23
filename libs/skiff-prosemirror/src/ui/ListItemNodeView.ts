import { Node } from 'prosemirror-model';
import { Decoration, EditorView } from 'prosemirror-view';

import { MARK_FONT_SIZE, MARK_TEXT_COLOR } from '../MarkNames'; // This implements the `NodeView` interface
import { IMAGE } from '../NodeNames';

import { FONT_PX_SIZE_DEFAULT } from './findActiveFontSize';
// https://prosemirror.net/docs/ref/#view.NodeView

class ListItemNodeView {
  // This implements the `NodeView` interface
  // The outer DOM node that represents the list item element.
  dom: HTMLLIElement;

  // This implements the `NodeView` interface.
  // The DOM node that should hold the node's content.
  contentDOM: HTMLElement | null;

  _nodeUpdated: Node | null | undefined;

  constructor(node: Node, editorView: EditorView, getPos: () => number) {
    const dom = document.createElement('li');
    this.dom = dom;
    this.contentDOM = dom;

    this._updateDOM(node);
  }

  // This implements the `NodeView` interface.
  update(node: Node, decorations: Array<Decoration>): boolean {
    return this._updateDOM(node);
  }

  _updateDOM(node: Node): boolean {
    const { dom } = this;
    // According to `ListItemNodeSpec`, a valid list item has the following
    // structure: `li > paragraph > text`.
    const paragraph = node.firstChild;
    const initialContent = paragraph ? paragraph.firstChild : null;

    if (this._nodeUpdated === node) {
      return initialContent?.type.name === IMAGE; // when content is image dont unmount node - causing blinking images
    }

    this._nodeUpdated = node;

    // This resolves the styles for the counter by examines the marks for the
    // first text node of the list item.
    const marks = initialContent?.isText && initialContent.textContent ? initialContent.marks : null;
    let cssColor;
    let cssFontSize;
    let cssText = '';

    if (Array.isArray(marks)) {
      marks.forEach((mark) => {
        const { attrs, type } = mark;

        switch (type.name) {
          case MARK_TEXT_COLOR:
            cssColor = attrs.color;
            break;

          case MARK_FONT_SIZE:
            cssFontSize = attrs.px ? attrs.px : String(FONT_PX_SIZE_DEFAULT);
            break;
          default:
        }
      });
    }

    // The counter of the list item is a pseudo-element that uses
    // the CSS variables (e.g `--skiff-list-style-color`) for styling.
    // This defines the CSS variables scoped for the pseudo-element.
    // See `src/ui/skiff-list.css` for more details.
    if (cssColor) {
      cssText += `--skiff-list-style-color: ${cssColor};`;
    }

    if (cssFontSize) {
      cssText += `--skiff-list-style-font-size: ${cssFontSize}px;`;
    }

    dom.style.cssText = cssText;
    const { align } = node.attrs;

    if (align) {
      dom.setAttribute('data-align', align);
    } else {
      dom.removeAttribute('data-align');
    }

    return true;
  }
}

export default ListItemNodeView;
