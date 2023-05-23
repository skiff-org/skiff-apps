import { MarkSpec } from 'prosemirror-model';

const CodeMarkSpec: MarkSpec = {
  parseDOM: [
    {
      tag: 'code'
    }
  ],

  toDOM() {
    return ['code', 0];
  }
};
export default CodeMarkSpec;
