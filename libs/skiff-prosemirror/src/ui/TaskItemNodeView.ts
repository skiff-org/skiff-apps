/* eslint-disable class-methods-use-this */
import { Icon } from 'nightwatch-ui';
import { Node } from 'prosemirror-model';
import { EditorView, NodeView } from 'prosemirror-view';
import { isMobile } from 'react-device-detect';

import { createElementWithClassAndIcon } from '../floatingToolbar/toolbarItems/utils';
// import checkBoxIcon from './svgs/check_box.svg';
// import checkedCheckBoxIcon from './svgs/checked_check_box.svg';
import { MARK_FONT_SIZE } from '../MarkNames';
import { customStateKey } from '../skiffEditorCustomStatePlugin';

import { FONT_PX_SIZE_DEFAULT } from './findActiveFontSize';
import ListItemNodeView from './ListItemNodeView';

class TaskItemNodeView extends ListItemNodeView {
  view: EditorView;

  node: Node;

  checkBox: HTMLElement;

  getPos: () => number;

  checkBoxIcon: HTMLElement;

  constructor(node: Node, editorView: EditorView, getPos: () => number) {
    super(node, editorView, getPos);

    this.contentDOM = document.createElement('span');

    this.view = editorView;
    this.node = node;
    this.getPos = getPos;
    this.dom.classList.add('list-task');

    this.checkBox = document.createElement('button');

    this.checkBoxIcon = createElementWithClassAndIcon({
      type: 'div',
      iconName: node.attrs.checked ? Icon.CheckboxFilled : Icon.CheckboxEmpty,
      dataTest: 'check-box-icon',
      defaultColor: true,
      defaultTheme: true
    });
    this.checkBoxIcon.classList.add('check-box-icon');
    this.checkBox.appendChild(this.checkBoxIcon);

    this.checkBox.classList.add('task-checkbox');
    this.checkBox.dataset.test = 'task-checkbox';

    this.checkBox.contentEditable = 'false';

    if (this.node.attrs.checked) {
      this.dom.classList.add('checked');
    }

    // to prevent focus loose when clicking the checkbox
    this.checkBox.addEventListener('mousedown', (e) => {
      e.preventDefault();
    });

    this.checkBox.addEventListener('click', () => {
      if (customStateKey.getState(editorView.state)?.readOnly) {
        return;
      }
      // update state
      const { tr } = this.view.state;
      tr.setNodeMarkup(this.getPos(), undefined, {
        ...this.node.attrs,
        checked: !this.node.attrs.checked
      });
      this.view.dispatch(tr);
      this.view.focus();

      // update dom
      this.setDomAttrs(this.node, this.dom);
    });

    this.dom.appendChild(this.checkBox);
    this.dom.appendChild(this.contentDOM);

    this.update(this.node);
  }

  setDomAttrs(node: Node, element: HTMLElement) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  ignoreMutation: NodeView['ignoreMutation'] = (event) => isMobile || event.type !== 'selection';

  update(node: Node): boolean {
    if (node.type !== this.node.type) return false;
    if (!this.node.sameMarkup(node)) return false;
    this._updateDOM(node);

    if (!this.contentDOM!.isConnected) {
      return false;
    }

    return true;
  }

  _updateDOM(node: Node): boolean {
    super._updateDOM(node);

    const { dom } = this;
    const paragraph = node.firstChild;
    const initialContent = paragraph ? paragraph.firstChild : null;

    const marks = initialContent?.isText && initialContent.textContent ? initialContent.marks : null;

    let cssFontSize;
    const cssText = '';

    if (Array.isArray(marks)) {
      marks.forEach((mark) => {
        const { attrs, type } = mark;
        if (type.name === MARK_FONT_SIZE) {
          cssFontSize = attrs.px ? attrs.px : String(FONT_PX_SIZE_DEFAULT);
        }
      });
    }

    if (cssFontSize && this.checkBox) {
      const checkBoxStyle = this.checkBox.style;

      const checkBoxSize = Math.max(cssFontSize, 16);
      checkBoxStyle.setProperty('--check-box-size', `${checkBoxSize}px`);
    }

    if (cssFontSize && this.contentDOM instanceof HTMLElement) {
      const paragraphStyle = this.contentDOM.style;
      const paddingAndMarginOffset = cssFontSize - 16;

      paragraphStyle.setProperty('--padding-offset', `${paddingAndMarginOffset}px`);
    }

    dom.style.cssText = cssText;

    return true;
  }
}

export default TaskItemNodeView;
