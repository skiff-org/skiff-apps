import { MarkSpec } from 'prosemirror-model';

export enum FontNameIds {
  SYSTEM = 'var(--skiff-content-font-family)',
  SERIF = 'EB Garamond',
  MONO = 'Menlo, Space Mono, Consolas, Courier, monospace'
}

export enum FontNameLabels {
  SYSTEM = 'System',
  SERIF = 'Serif',
  MONO = 'Mono'
}

export enum FontNameIcons {
  SYSTEM = 'text',
  SERIF = 'text-serif',
  MONO = 'text-mono'
}

const FontTypeMarkSpec: MarkSpec = {
  attrs: {
    name: { default: '' }
  },
  inline: true,
  group: 'inline',
  parseDOM: [
    {
      style: 'font-family',
      getAttrs: (name) => ({
        name: name ? name.toString().replace(/["']/g, '') : ''
      })
    }
  ],

  toDOM(node) {
    const { name } = node.attrs;
    const attrs: { style?: string } = {};

    if (name) {
      attrs.style = `font-family: ${name}`;
    }

    return ['span', attrs, 0];
  }
};
export default FontTypeMarkSpec;
