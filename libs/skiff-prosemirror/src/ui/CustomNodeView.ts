/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Node } from 'prosemirror-model';
import { Decoration, EditorView } from 'prosemirror-view';
import React from 'react';
import ReactDOM from 'react-dom';

import SelectionObserver from './SelectionObserver';

export type NodeViewProps = {
  editorView: EditorView;
  getPos: () => number;
  node: Node;
  selected: boolean;
  focused: boolean;
  decorations: Decoration[];
};
// Standard className for selected node.
const SELECTED_NODE_CLASS_NAME = 'ProseMirror-selectednode';
const mountedViews = new Set<CustomNodeView>();
const pendingViews = new Set<CustomNodeView>();

function onMutation(mutations: any, observer: MutationObserver): void {
  const root = document.body;

  if (!root) {
    return;
  }

  const mountingViews = [];

  for (const view of pendingViews) {
    const el = view.dom;

    if (root.contains(el)) {
      pendingViews.delete(view);
      mountingViews.push(view);

      view.__renderReactComponent();
    }
  }

  for (const view of mountedViews) {
    const el = view.dom;

    if (!root.contains(el) && !(el instanceof HTMLElement)) {
      mountedViews.delete(el);
      ReactDOM.unmountComponentAtNode(el);
    }
  }

  mountingViews.forEach((view) => mountedViews.add(view));

  if (mountedViews.size === 0) {
    observer.disconnect();
  }
}

// Workaround to get in-selection views selected.
// See https://discuss.prosemirror.net/t/copy-selection-issue-with-the-image-node/1673/2;
function onSelection(entries: Array<any>, observer: SelectionObserver): void {
  if (!window.getSelection) {
    console.warn('window.getSelection() is not supported');
    observer.disconnect();
    return;
  }

  const selection = window.getSelection();

  if (!selection?.containsNode) {
    console.warn('selection.containsNode() is not supported');
    observer.disconnect();
    return;
  }

  for (const view of mountedViews) {
    const el = view.dom;

    if (selection?.containsNode(el)) {
      view.selectNode();
    } else {
      view.deselectNode();
    }
  }

  if (mountedViews.size === 0) {
    observer.disconnect();
  }
}

const selectionObserver = new SelectionObserver(onSelection);
const mutationObserver = new MutationObserver(onMutation); // This implements the `NodeView` interface and renders a Node with a react
// Component.
// https://prosemirror.net/docs/ref/#view.NodeView
// https://github.com/ProseMirror/prosemirror-view/blob/master/src/viewdesc.js#L429

class CustomNodeView {
  dom: HTMLElement;

  props: NodeViewProps;

  _selected: null | boolean | undefined;

  constructor(node: Node, editorView: EditorView, getPos: () => number, decorations: Array<Decoration>) {
    this.props = {
      decorations,
      editorView,
      getPos,
      node,
      selected: false,
      focused: false
    };
    pendingViews.add(this);
    // The editor will use this as the node's DOM representation
    const dom = this.createDOMElement();
    this.dom = dom;
    // CustomNodeView is only used in BookmarkNodeView, which displays a _single_ span element.
    // It should be a normal NodeView, then this file can be removed ( and everything that depends on it )
    // TODO: Fix or change BookmarkNodeView
    // @ts-ignore
    dom.onclick = this._onClick;

    if (pendingViews.size === 1) {
      mutationObserver.observe(document, {
        childList: true,
        subtree: true
      });
      if (document instanceof Element) selectionObserver.observe(document);
    }
  }

  update(node: Node, decorations: Array<Decoration>): boolean {
    this.props = {
      ...this.props,
      node
    };

    this.__renderReactComponent();

    return true;
  }

  stopEvent(): boolean {
    return false;
  }

  // Mark this node as being the selected node.
  selectNode() {
    this._selected = true;
    this.dom.classList.add(SELECTED_NODE_CLASS_NAME);

    this.__renderReactComponent();
  }

  // Remove selected node marking from this node.
  deselectNode() {
    this._selected = false;
    this.dom.classList.remove(SELECTED_NODE_CLASS_NAME);

    this.__renderReactComponent();
  }

  // This should be overwrite by subclass.
  createDOMElement(): HTMLElement {
    // The editor will use this as the node's DOM representation.
    // return document.createElement('span');
    throw new Error('not implemented');
  }

  // This should be overwrite by subclass.
  renderReactComponent(): React.ReactElement<any> {
    // return <CustomNodeViewComponent {...this.props} />;
    throw new Error('not implemented');
  }

  destroy(): void {
    // Called when the node view is removed from the editor or the whole
    // editor is destroyed.
    // sub-class may override this method.
  }

  __renderReactComponent(): void {
    const { editorView, getPos } = this.props;

    if (editorView.state && editorView.state.selection) {
      const { from } = editorView.state.selection;
      const pos = getPos();
      if (this._selected) {
        this.props.selected = this._selected;
      }
      // TODO: Again, this file could be removed, only BookmarkNodeView depends on it
      // @ts-ignore
      this.props.focused = editorView.focused && pos === from;
    } else {
      this.props.selected = false;
      this.props.focused = false;
    }

    ReactDOM.render(this.renderReactComponent(), this.dom);
  }
}

export default CustomNodeView;
