// https://github.com/ProseMirror/prosemirror-schema-basic/blob/master/src/schema-basic.js
// :: NodeSpec A code listing. Disallows marks or non-text inline
// nodes by default. Represented as a `<pre>` element with a
// `<code>` element inside of it.
import { NodeSpec } from 'prosemirror-model';

import uuid from './ui/uuid';

const CodeBlockNodeSpec: NodeSpec = {
  attrs: {
    id: {
      default: uuid()
    },
    lang: {
      default: 'none'
    }
  },
  content: 'text*',
  group: 'block',
  code: true,
  selectable: true,
  defining: true,
  parseDOM: [
    {
      tag: 'pre',
      preserveWhitespace: 'full'
    }
  ],

  toDOM() {
    return ['pre', ['code', 0]];
  }
};
export default CodeBlockNodeSpec;
