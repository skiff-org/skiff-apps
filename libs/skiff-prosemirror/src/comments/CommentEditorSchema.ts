import { DOMOutputSpecArray, Mark, MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import { addListNodes } from 'prosemirror-schema-list';

import BlockquoteNodeSpec from '../BlockquoteNodeSpec';
import BulletListNodeSpec from '../BulletListNodeSpec';
import HeadingNodeSpec from '../HeadingNodeSpec';
import ListItemNodeSpec from '../ListItemNodeSpec';
import MentionNodeSpec from '../MentionNodeSpec';
import OrderedListNodeSpec from '../OrderedListNodeSpec';
import sanitizeURL from '../sanitizeURL';
import uuid from '../ui/uuid';
const pDOM: DOMOutputSpecArray = ['p', 0];

export const nodes: { [key: string]: NodeSpec } = {
  doc: {
    content: 'block+'
  },

  mention: MentionNodeSpec,

  // :: NodeSpec A plain paragraph textblock. Represented in the DOM
  // as a `<p>` element.
  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM() {
      return pDOM;
    }
  },
  // :: NodeSpec The text node.
  text: {
    group: 'inline'
  },

  blockquote: BlockquoteNodeSpec,
  heading: HeadingNodeSpec,
  ordered_list: OrderedListNodeSpec,
  bullet_list: BulletListNodeSpec,
  list_item: ListItemNodeSpec
};

const emDOM: DOMOutputSpecArray = ['em', 0];
const strongDOM: DOMOutputSpecArray = ['strong', 0];
const codeDOM: DOMOutputSpecArray = ['code', 0];

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks: { [key: string]: MarkSpec } = {
  // :: MarkSpec A link. Has `href` and `title` attributes. `title`
  // defaults to the empty string. Rendered and parsed as an `<a>`
  // element.
  link: {
    attrs: {
      href: {},
      title: { default: null },
      id: { default: null }
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom: Node | string) {
          if (typeof dom === 'string') return null;
          return {
            href: sanitizeURL((dom as HTMLElement).getAttribute('href')),
            title: (dom as HTMLElement).getAttribute('title'),
            id: uuid() // genrate new id to prevent duplicates
          };
        }
      }
    ],
    // copied from LinkMarkSpec.ts
    toDOM(mark: Mark) {
      const { href, title, id } = mark.attrs;
      let hrefWithHttp = href;
      if (!hrefWithHttp.startsWith('http')) {
        hrefWithHttp = `https://${hrefWithHttp}`;
      }
      return ['a', { href: hrefWithHttp, title, target: '_blank', id }, 0];
    }
  },

  // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
  // Has parse rules that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return emDOM;
    }
  },

  // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
  // also match `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      {
        tag: 'b',
        getAttrs: (dom: Node | string) => {
          if (typeof dom === 'string') return null;
          return (dom as HTMLElement).style.fontWeight !== 'normal' && null;
        }
      },
      {
        style: 'font-weight',
        getAttrs: (value: Node | string) => {
          if (typeof value !== 'string') return null;
          return /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null;
        }
      }
    ],
    toDOM() {
      return strongDOM;
    }
  },

  // :: MarkSpec Code font mark. Represented as a `<code>` element.
  code: {
    parseDOM: [{ tag: 'code' }],
    toDOM() {
      return codeDOM;
    }
  }
};

const schemaWithoutList = new Schema({ nodes, marks });
export const schema = new Schema({
  nodes: addListNodes(schemaWithoutList.spec.nodes, 'paragraph block*', 'block'),
  marks: schemaWithoutList.spec.marks
});
