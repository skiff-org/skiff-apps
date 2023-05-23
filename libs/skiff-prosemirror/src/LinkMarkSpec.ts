import type { Mark, MarkSpec } from 'prosemirror-model';

import sanitizeURL from './sanitizeURL';
import uuid from './ui/uuid';

const LinkMarkSpec: MarkSpec = {
  attrs: {
    href: {
      default: null
    },
    rel: {
      default: 'noopener noreferrer nofollow'
    },
    target: {
      default: 'blank'
    },
    title: {
      default: null
    },
    id: {
      default: null
    }
  },
  inclusive: false,
  parseDOM: [
    {
      tag: 'a[href]',
      getAttrs: (dom: Node | string) => {
        if (!(dom instanceof HTMLElement)) {
          return {};
        }
        const href = dom.getAttribute('href');
        const target = href?.indexOf('#') === 0 ? '' : 'blank';
        return {
          href: sanitizeURL(dom.getAttribute('href')),
          title: dom.getAttribute('title'),
          id: uuid(), // generate new id to prevent duplicates
          target
        };
      }
    }
  ],

  // copied from CommentEditorSchema.ts
  toDOM(mark: Mark) {
    const { href, title, id } = mark.attrs;
    let hrefWithHttp = href;
    if (!hrefWithHttp.startsWith('http')) {
      hrefWithHttp = `https://${hrefWithHttp}`;
    }
    return ['a', { href: hrefWithHttp, title, target: '_blank', id }, 0];
  }
};
export default LinkMarkSpec;
