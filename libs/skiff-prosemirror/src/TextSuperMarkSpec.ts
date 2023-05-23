import { MarkSpec } from 'prosemirror-model';

const TextSuperMarkSpec: MarkSpec = {
  parseDOM: [
    {
      tag: 'sup'
    },
    {
      style: 'vertical-align',
      getAttrs: (value) => value === 'super' && null
    }
  ],

  toDOM() {
    return ['sup', 0];
  }
};
export default TextSuperMarkSpec;
