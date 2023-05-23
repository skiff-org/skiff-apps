/* eslint-disable max-classes-per-file */
import './skiff-bookmark-view.css';

import { Node } from 'prosemirror-model';
import { Decoration } from 'prosemirror-view';
import React from 'react';

import { ATTRIBUTE_BOOKMARK_ID, ATTRIBUTE_BOOKMARK_VISIBLE } from '../BookmarkNodeSpec';

import type { NodeViewProps } from './CustomNodeView';
import CustomNodeView from './CustomNodeView';
import Icon from './Icon';

class BookmarkViewBody extends React.PureComponent<NodeViewProps> {
  _onClick = (e: React.SyntheticEvent): void => {
    e.preventDefault();
    const { id } = this.props.node.attrs;
    const hash = `#${id}`;

    if (window.location.hash !== hash) {
      window.location.hash = hash;
    }
  };

  render() {
    const { id, visible } = this.props.node.attrs;
    const icon = id && visible ? Icon.get('bookmark') : null;
    return (
      <span onClick={this._onClick} onKeyPress={() => {}} role='button' tabIndex={-1}>
        {icon}
      </span>
    );
  }
}

class BookmarkNodeView extends CustomNodeView {
  // @override
  createDOMElement(): HTMLElement {
    const el = document.createElement('a');
    el.className = 'skiff-bookmark-view';

    this._updateDOM(el);

    return el;
  }

  // @override
  update(node: Node, decorations: Array<Decoration>): boolean {
    super.update(node, decorations);
    return true;
  }

  // @override
  renderReactComponent(): React.ReactElement<any> {
    return <BookmarkViewBody {...this.props} />;
  }

  _updateDOM(el: HTMLElement): void {
    const { id, visible } = this.props.node.attrs;
    el.setAttribute('id', id);
    el.setAttribute('title', id);
    el.setAttribute(ATTRIBUTE_BOOKMARK_ID, id);
    if (visible) {
      el.setAttribute(ATTRIBUTE_BOOKMARK_VISIBLE, 'true');
    }
  }
}

export default BookmarkNodeView;
