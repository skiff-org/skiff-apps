import { EditorState, Plugin } from 'prosemirror-state';

import { ATTRIBUTE_LAYOUT, LAYOUT } from './DocNodeSpec';
import { getCustomState } from './skiffEditorCustomStatePlugin';

const SPEC = {
  props: {
    attributes: renderAttributes
  }
};

function renderAttributes(editorState: EditorState): Record<string, any> {
  const { doc } = editorState;
  const { isPublicDocument } = getCustomState(editorState);

  const attrs: Record<string, any> = {
    class: `skiff-prosemirror-editor ${isPublicDocument ? 'public' : ''}`
  };
  const { width, padding, layout } = doc.attrs;
  let style = '';
  let computedLayout;

  if (width) {
    const inWidth = width / 72;

    if (!computedLayout && inWidth >= 11 && inWidth <= 11.5) {
      // Round up to letter size.
      computedLayout = LAYOUT.US_LETTER_LANDSCAPE;
    } else if (!computedLayout && inWidth >= 8 && inWidth <= 8.6) {
      // Round up to letter size.
      computedLayout = LAYOUT.FULL_WIDTH;
    } else {
      // Use custom width (e.g. imported from google doc).
      style += `width: ${width}px;`;
    }

    if (padding) {
      style += `padding-left: ${padding}px;`;
      style += `padding-right: ${padding}px;`;
    }

    attrs.style = style;
  } else {
    computedLayout = layout;
  }

  if (computedLayout) {
    attrs[ATTRIBUTE_LAYOUT] = computedLayout;
  }

  return attrs;
} // Unfortunately the root node `doc` does not supoort `toDOM`, thus
// we'd have to assign its `attributes` manually.

class EditorPageLayoutPlugin extends Plugin {
  constructor() {
    super(SPEC);
  }
}

export default EditorPageLayoutPlugin;
