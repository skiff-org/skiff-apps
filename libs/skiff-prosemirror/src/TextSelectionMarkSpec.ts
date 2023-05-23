import { MarkSpec } from 'prosemirror-model';

const TextSelectionMarkSpec: MarkSpec = {
  attrs: {
    id: { default: '' }
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      tag: 'skiff-text-selection'
    }
  ],

  toDOM() {
    return [
      'skiff-text-selection',
      {
        class: 'skiff-text-selection'
      },
      0
    ];
  }
};
export default TextSelectionMarkSpec;
