/* eslint-disable class-methods-use-this */
import { Node } from 'prosemirror-model';
import { EditorView } from 'prosemirror-view';
import { StorageTypes } from 'skiff-utils';

import { customStateKey } from '../skiffEditorCustomStatePlugin';
import ListItemNodeView from '../ui/ListItemNodeView';
import uuid from '../ui/uuid';
import { getDocId, getDocNodeItem, setDocNodeItem } from '../utils/storageUtils';

import { insertFirstToggleContent } from './utils';

class ToggleItemNodeView extends ListItemNodeView {
  view: EditorView;

  node: Node;

  toggleButton: HTMLElement;

  contentPlaceHolderButton: HTMLElement;

  titlePlaceHolderButton: HTMLElement;

  getPos: () => number;

  docID: string | undefined;

  constructor(node: Node, editorView: EditorView, getPos: () => number) {
    super(node, editorView, getPos);

    this.contentDOM = document.createElement('div');
    this.contentDOM.classList.add('toggle-body');
    this.view = editorView;
    this.node = node;
    this.docID = getDocId(this.view.state);

    this.getPos = getPos;
    this.dom.classList.add('toggle-item');

    this.toggleButton = document.createElement('button');
    this.toggleButton.classList.add('item-toggle-button');
    this.toggleButton.dataset.test = 'toggle-item-toggle';
    this.toggleButton.contentEditable = 'false';
    this.toggleButton.tabIndex = -1;

    if (!node.attrs.id) {
      const {
        dispatch,
        state: { tr }
      } = this.view;

      this.node.attrs.id = uuid();
      // Sometimes (when convert toggle list to paragraph for example) the setNodeMarkup crash the editor,
      // We will add try and catch till we will have better handling on: libs/skiff-prosemirror/src/toggleHeading.ts
      try {
        tr.setNodeMarkup(this.getPos(), undefined, this.node.attrs);
        dispatch(tr);
      } catch (e) {
        console.log('fail on change the id for a toggle item');
      }

      this.dom.id = this.node.attrs.id;
    }

    this.setToggle(this.getToggle());

    this.toggleButton.onclick = () => {
      if (this.docID) this.setToggle(!this.getToggle());
      else this.dom.classList.toggle('toggled');
    };

    this.contentPlaceHolderButton = document.createElement('button');
    this.contentPlaceHolderButton.classList.add('toggle-content-placeholder-button');
    this.contentPlaceHolderButton.dataset.test = 'toggle-item-content-placeholder';
    this.contentPlaceHolderButton.innerText = 'Empty toggle item, click to add content';

    this.contentPlaceHolderButton.addEventListener('click', () => {
      insertFirstToggleContent(this.view, this.node, this.getPos());
    });

    this.titlePlaceHolderButton = document.createElement('span');
    this.titlePlaceHolderButton.classList.add('toggle-title-placeholder');
    this.titlePlaceHolderButton.innerText = 'Toggle';

    this.dom.appendChild(this.toggleButton);
    this.dom.appendChild(this.titlePlaceHolderButton);
    this.dom.appendChild(this.contentDOM);
    this.dom.appendChild(this.contentPlaceHolderButton);

    this.update(this.node);
  }

  getToggle() {
    if (this.docID) return getDocNodeItem(this.docID, StorageTypes.TOGGLE_ITEM, this.node.attrs.id, true);
    return true;
  }

  setToggle(state: boolean) {
    if (customStateKey.getState(this.view.state)?.readOnly) {
      return;
    }
    if (this.docID && this.node.attrs.id)
      setDocNodeItem(this.docID, StorageTypes.TOGGLE_ITEM, this.node.attrs.id, state);
    if (state) this.dom.classList.add('toggled');
    else this.dom.classList.remove('toggled');
  }

  setDomAttrs(node: Node, element: HTMLElement) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  ignoreMutation(event: MutationRecord | { type: string }) {
    return event.type !== 'selection';
  }

  update(node: Node): boolean {
    if (node.type !== this.node.type) return false;

    if (!this.node.sameMarkup(node)) return false;

    this._updateDOM(node);

    if (!this.contentDOM?.isConnected) {
      return false;
    }

    this.node = node;
    return true;
  }

  _updateDOM(node: Node): boolean {
    super._updateDOM(node);

    const { dom } = this;

    dom.classList.toggle('empty-content', node.childCount <= 1);

    const paragraph = node.firstChild?.firstChild;
    const textContent = paragraph ? paragraph.firstChild : null;

    dom.classList.toggle('empty-title', !textContent);

    return true;
  }
}

export default ToggleItemNodeView;
