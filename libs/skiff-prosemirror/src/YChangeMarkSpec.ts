import { MarkSpec } from 'prosemirror-model';

// indicate a change (addition or deletion) for the document version comparison
const YChangeMarkSpec: MarkSpec = {
  attrs: {
    user: { default: null },
    type: { default: null },
    color: { default: { light: null } }
  },
  parseDOM: [{ tag: 'span' }],
  toDOM(node) {
    return [
      'span',
      {
        ychange_user: node.attrs.user,
        ychange_type: node.attrs.type,
        ychange_color: node.attrs.color.light
      }
    ];
  }
};
export default YChangeMarkSpec;
