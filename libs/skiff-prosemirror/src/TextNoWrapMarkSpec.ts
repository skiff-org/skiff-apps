import { MarkSpec } from 'prosemirror-model';

const TextNoWrapMarkSpec: MarkSpec = {
  parseDOM: [
    {
      tag: 'nobr'
    }
  ],

  toDOM() {
    return ['nobr', 0];
  }
};
export default TextNoWrapMarkSpec;
