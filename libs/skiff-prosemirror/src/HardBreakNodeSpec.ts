import { NodeSpec } from 'prosemirror-model';

const HardBreakNodeSpec: NodeSpec = {
  inline: true,
  group: 'inline',
  selectable: false,
  parseDOM: [
    {
      tag: 'br'
    }
  ],

  toDOM() {
    return ['br'];
  }
};
export default HardBreakNodeSpec;
