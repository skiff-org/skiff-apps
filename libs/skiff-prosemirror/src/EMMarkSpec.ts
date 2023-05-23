import { MarkSpec } from 'prosemirror-model';

const EMMarkSpec: MarkSpec = {
  parseDOM: [
    {
      tag: 'i'
    },
    {
      tag: 'em'
    },
    {
      style: 'font-style=italic'
    }
  ],

  toDOM() {
    return ['em', 0];
  }
};
export default EMMarkSpec;
