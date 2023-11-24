import { Icon, IconProps, Icons, stringToColor } from 'nightwatch-ui';
import { NodeSpec } from 'prosemirror-model';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { NwContentType } from 'skiff-graphql';

import { InviteMentionType, UserMentionType } from './mentionsMenu/utils';
import uuid from './ui/uuid';

const MENTION_NODE_CLASS = 'mention-node';

const getAttrs = (dom: Node | string) => {
  if (!(dom instanceof HTMLElement)) {
    return {};
  }
  const type = dom.getAttribute('data-mention-type');
  // user mentions should get unique id
  const id = dom.getAttribute('data-mention-id');
  const name = dom.getAttribute('data-mention-name');
  const nodeID = type === UserMentionType ? uuid() : dom.getAttribute('data-mention-nodeID');
  const hidePreview = dom.getAttribute('data-mention-hidePreview');

  return {
    id,
    name,
    type,
    nodeID,
    hidePreview
  };
};

const MentionNodeSpec: NodeSpec = {
  group: 'inline',
  inline: true,
  atom: true,
  attrs: {
    id: { default: '' },
    name: { default: '' },
    type: { default: '' },
    nodeID: { default: '' },
    hidePreview: { default: false }
  },
  selectable: false,
  draggable: true,
  toDOM: (node) => {
    let dom;
    if (node.attrs.type === UserMentionType || node.attrs.type === InviteMentionType) {
      dom = document.createElement('span');

      dom.innerText = `@${node.attrs.name}`;
      dom.style.color = stringToColor(node.attrs.name)[0];
      dom.style.background = stringToColor(node.attrs.name)[1];
    } else {
      dom = document.createElement('div');

      const a = document.createElement('a');
      a.innerText = node.attrs.name;
      a.href = `/file/${node.attrs.id}`;

      const icon = document.createElement('span');

      let iconType: IconProps['icon'];
      switch (node.attrs.type) {
        case NwContentType.Folder:
          iconType = Icon.Folder;
          break;
        case NwContentType.RichText:
          iconType = Icon.File;
          break;
        case NwContentType.Pdf:
          iconType = Icon.Pdf;
          break;
        default:
          iconType = Icon.File;
          break;
      }

      const htmlContent = ReactDOMServer.renderToString(React.createElement(Icons, { icon: iconType, color: 'link' }));
      // eslint-disable-next-line no-unsanitized/property
      icon.innerHTML = htmlContent;

      dom.append(icon);
      dom.append(a);
    }

    dom.classList.add(MENTION_NODE_CLASS);
    dom.setAttribute('data-mention-id', node.attrs.id);
    dom.setAttribute('data-mention-name', node.attrs.name);
    dom.setAttribute('data-mention-type', node.attrs.type);
    dom.setAttribute('data-mention-nodeID', node.attrs.nodeID);
    dom.setAttribute('data-mention-hidePreview', node.attrs.hidePreview);

    return { dom };
  },
  parseDOM: [
    // Both have high priority so they will get parsed before normal text/link (default priority -> 50)
    {
      priority: 100,
      tag: `span.${MENTION_NODE_CLASS}`,
      getAttrs
    },
    {
      priority: 100,
      tag: `a.${MENTION_NODE_CLASS}`,
      getAttrs
    }
  ]
};
export default MentionNodeSpec;
