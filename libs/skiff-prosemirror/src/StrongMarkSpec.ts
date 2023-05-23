import { MarkSpec } from 'prosemirror-model';

const CSS_BOLD_PATTERN = /^(bold(er)?|[5-9]\d{2,})$/;

const StrongMarkSpec: MarkSpec = {
  parseDOM: [
    {
      tag: 'strong'
    }, // This works around a Google Docs misbehavior where
    // pasted content will be inexplicably wrapped in `<b>`
    // tags with a font-weight normal.
    {
      tag: 'b',
      getAttrs: (node) => {
        if (!(node instanceof HTMLElement)) {
          return {};
        }
        return node.style.fontWeight !== 'normal' && null;
      }
    },
    {
      style: 'font-weight',
      getAttrs: (value) => CSS_BOLD_PATTERN.test(value.toString()) && null
    }
  ],

  toDOM() {
    return ['strong', 0];
  }
};
export default StrongMarkSpec;
